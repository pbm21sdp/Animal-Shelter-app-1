from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import warnings
import time
warnings.filterwarnings('ignore')

# CLIP availability check
try:
    import torch
    from transformers import CLIPProcessor, CLIPModel
    CLIP_AVAILABLE = True
except ImportError:
    CLIP_AVAILABLE = False
    print("WARNING: CLIP not available. Install with: pip install torch transformers Pillow")

# CLIP model — loaded lazily on first request
clip_model = None
clip_processor = None

def load_clip():
    global clip_model, clip_processor
    if clip_model is None:
        print("Loading CLIP model (first time — may take 1-2 minutes)...")
        from transformers import CLIPProcessor, CLIPModel
        clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        print("CLIP model loaded successfully!")
    return clip_model, clip_processor

app = Flask(__name__)
CORS(app)

class AdoptionPredictor:
    def __init__(self):
        self.model = None

    def prepare_data(self, adoptions, aggregation='daily'):
        """Convert adoptions to time series with specified aggregation"""
        df = pd.DataFrame(adoptions)
        df['date'] = pd.to_datetime(df['createdAt'])

        print(f"\n=== PREPARE DATA DEBUG ===")
        print(f"Aggregation: {aggregation}")
        print(f"Total adoptions received: {len(adoptions)}")
        print(f"Date range: {df['date'].min()} to {df['date'].max()}")

        # Create period column based on aggregation
        if aggregation == 'daily':
            df['period'] = df['date'].dt.floor('D')
            freq = 'D'
        elif aggregation == 'weekly':
            # Floor to week start (Monday)
            df['period'] = df['date'] - pd.to_timedelta(df['date'].dt.dayofweek, unit='D')
            df['period'] = df['period'].dt.floor('D')
            freq = '7D'
        elif aggregation == 'monthly':
            # Floor to month start
            df['period'] = df['date'].dt.to_period('M').dt.to_timestamp()
            freq = 'MS'
        else:
            df['period'] = df['date'].dt.floor('D')
            freq = 'D'

        # Count adoptions per period
        counts = df.groupby('period').size().reset_index(name='y')
        counts.columns = ['ds', 'y']
        counts = counts.sort_values('ds').reset_index(drop=True)

        print(f"Unique periods with data: {len(counts)}")
        print(f"Sample counts (first 5):")
        print(counts.head().to_string())

        # For weekly, use 7-day intervals starting from first data point
        if aggregation == 'weekly':
            # Calculate number of weeks
            days_diff = (counts['ds'].max() - counts['ds'].min()).days
            num_weeks = days_diff // 7 + 1
            date_range = pd.date_range(
                start=counts['ds'].min(),  # Start from ACTUAL first data point
                periods=num_weeks,
                freq='7D'
            )
        else:
            date_range = pd.date_range(
                start=counts['ds'].min(),
                end=counts['ds'].max(),
                freq=freq
            )

        print(f"Date range length: {len(date_range)}")
        print(f"Date range start: {date_range[0]}")

        # Create full dataframe
        full_df = pd.DataFrame({'ds': date_range})

        # For weekly, we need to match dates more carefully
        if aggregation == 'weekly':
            # Direct merge should work now since we start from the same point
            full_df = full_df.merge(counts, on='ds', how='left')
            full_df['y'] = full_df['y'].fillna(0).astype(int)
        else:
            # Regular merge for daily/monthly
            full_df = full_df.merge(counts, on='ds', how='left')
            full_df['y'] = full_df['y'].fillna(0).astype(int)

        print(f"Total periods after processing: {len(full_df)}")
        print(f"Non-zero periods: {(full_df['y'] > 0).sum()}")
        print(f"Total adoptions in aggregated data: {full_df['y'].sum()}")
        print(f"\nFinal data (first 10 rows):")
        print(full_df.head(10).to_string())
        print(f"\nFinal data (last 10 rows):")
        print(full_df.tail(10).to_string())
        print(f"=== END DEBUG ===\n")

        return full_df

    def train_and_predict_advanced(self, adoptions, periods, aggregation='daily'):
        """Train model for better predictions"""
        if len(adoptions) < 7:
            raise ValueError("Not enough data (minimum 7 adoptions required)")

        df = self.prepare_data(adoptions, aggregation)

        # Check minimum periods based on aggregation
        min_periods = {
            'daily': 14,    # At least 2 weeks
            'weekly': 8,    # At least 8 weeks (2 months)
            'monthly': 3    # At least 3 months
        }

        required = min_periods.get(aggregation, 3)

        if len(df) < required:
            raise ValueError(f"Not enough time periods for {aggregation} predictions. "
                             f"Need at least {required} {aggregation} periods, but only have {len(df)}. "
                             f"Try switching to daily view or add more historical data.")

        try:
            # Use Exponential Smoothing (more stable than SARIMA)
            if len(df) >= 14:
                # Use seasonal model if enough data
                seasonal_periods = 7 if aggregation == 'daily' else (4 if aggregation == 'weekly' else None)

                if seasonal_periods and len(df) >= seasonal_periods * 2:
                    print(f"Using seasonal model with period={seasonal_periods}")
                    model = ExponentialSmoothing(
                        df['y'],
                        seasonal_periods=seasonal_periods,
                        trend='add',
                        seasonal='add',
                        damped_trend=True
                    )
                else:
                    print("Using trend model (no seasonality)")
                    model = ExponentialSmoothing(
                        df['y'],
                        trend='add',
                        damped_trend=True
                    )
            else:
                # Simple trend model for small datasets
                print("Using simple trend model")
                model = ExponentialSmoothing(
                    df['y'],
                    trend='add'
                )

            fitted_model = model.fit(optimized=True)

            # Generate predictions
            forecast = fitted_model.forecast(steps=periods)

            # Debug: Print raw forecast
            print(f"\n=== FORECAST DEBUG ===")
            print(f"Periods requested: {periods}")
            print(f"Forecast length: {len(forecast)}")
            print(f"Raw forecast (first 10): {forecast[:10].tolist()}")
            print(f"Raw forecast (all): {forecast.tolist()}")
            print(f"Forecast mean: {forecast.mean():.2f}")
            print(f"Forecast sum: {forecast.sum():.2f}")
            print(f"Historical mean: {df['y'].mean():.2f}")
            print(f"Historical sum: {df['y'].sum()}")
            print(f"Historical max: {df['y'].max()}")
            print(f"Historical min: {df['y'].min()}")
            print(f"=== END FORECAST DEBUG ===\n")

            # If forecast is too low, add baseline
            hist_mean = df['y'].mean()
            if forecast.mean() < 0.5 and hist_mean > 0:
                print("WARNING: Forecast too low, adjusting...")
                # Adjust forecast to be at least 70% of historical average
                forecast = forecast + (hist_mean * 0.7)

            forecast = np.maximum(forecast, 0)  # No negative adoptions
            forecast = np.round(forecast)  # Round to whole numbers

            # Ensure at least some predictions are non-zero
            if forecast.sum() == 0 and hist_mean > 0:
                print("WARNING: All predictions are 0, using fallback")
                forecast = np.full(periods, max(1, round(hist_mean)))

            print(f"Final forecast after adjustments: {forecast.tolist()}")

            # Generate future dates
            last_date = df['ds'].iloc[-1]
            if aggregation == 'daily':
                future_dates = pd.date_range(start=last_date + timedelta(days=1), periods=periods, freq='D')
            elif aggregation == 'weekly':
                future_dates = pd.date_range(start=last_date + timedelta(weeks=1), periods=periods, freq='W')
            elif aggregation == 'monthly':
                future_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), periods=periods, freq='MS')

            # Calculate statistics
            hist_mean = float(df['y'].mean())
            pred_mean = float(forecast.mean())

            stats = {
                'averageHistorical': round(hist_mean, 1),
                'averagePredicted': round(pred_mean, 1),
                'totalPredicted': int(round(forecast.sum())),
                'trend': 'increasing' if pred_mean > hist_mean else 'decreasing',
                'trendPercentage': abs(int(((pred_mean - hist_mean) / hist_mean) * 100)) if hist_mean > 0 else 0
            }

            print(f"\n=== FINAL STATS ===")
            print(f"Statistics: {stats}")
            print(f"=== END STATS ===\n")

            return {
                'historicalDates': df['ds'].dt.strftime('%m/%d/%Y').tolist(),
                'historical': [int(x) for x in df['y'].tolist()],
                'predictionDates': [d.strftime('%m/%d/%Y') for d in future_dates],
                'predictions': [int(x) for x in forecast.tolist()],
                'statistics': stats,
                'aggregation': aggregation
            }

        except Exception as e:
            print(f"Advanced model failed: {e}, falling back to simple method")
            import traceback
            traceback.print_exc()
            return self.simple_prediction(df, periods, aggregation)

    def simple_prediction(self, df, periods, aggregation):
        """Simple moving average fallback"""
        print("\n=== USING SIMPLE PREDICTION FALLBACK ===")

        window = min(7, len(df))
        recent_avg = df['y'].tail(window).mean()

        print(f"Window size: {window}")
        print(f"Recent average: {recent_avg}")

        # Ensure minimum of 1 if there's any historical data
        if recent_avg < 0.5 and df['y'].sum() > 0:
            recent_avg = 1.0

        # Calculate trend
        if len(df) > 1:
            trend = (df['y'].iloc[-1] - df['y'].iloc[0]) / len(df)
        else:
            trend = 0

        print(f"Trend: {trend}")

        predictions = []
        for i in range(periods):
            # Base prediction with trend
            pred = recent_avg + (trend * i)

            # Add some variation (10% of average)
            variation = np.random.normal(0, max(recent_avg * 0.1, 0.3))
            pred = pred + variation

            # Ensure minimum of 1 if historical average > 0
            if recent_avg > 0:
                pred = max(1, round(pred))
            else:
                pred = max(0, round(pred))

            predictions.append(int(pred))

        print(f"Simple predictions: {predictions}")
        print(f"=== END SIMPLE PREDICTION ===\n")

        last_date = df['ds'].iloc[-1]
        if aggregation == 'daily':
            future_dates = pd.date_range(start=last_date + timedelta(days=1), periods=periods, freq='D')
        elif aggregation == 'weekly':
            future_dates = pd.date_range(start=last_date + timedelta(weeks=1), periods=periods, freq='W')
        elif aggregation == 'monthly':
            future_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), periods=periods, freq='MS')

        hist_mean = float(df['y'].mean())
        pred_mean = float(np.mean(predictions))

        stats = {
            'averageHistorical': round(hist_mean, 1),
            'averagePredicted': round(pred_mean, 1),
            'totalPredicted': int(sum(predictions)),
            'trend': 'increasing' if pred_mean > hist_mean else 'decreasing',
            'trendPercentage': abs(int(((pred_mean - hist_mean) / hist_mean) * 100)) if hist_mean > 0 else 0
        }

        return {
            'historicalDates': df['ds'].dt.strftime('%m/%d/%Y').tolist(),
            'historical': [int(x) for x in df['y'].tolist()],
            'predictionDates': [d.strftime('%m/%d/%Y') for d in future_dates],
            'predictions': predictions,
            'statistics': stats,
            'aggregation': aggregation
        }

predictor = AdoptionPredictor()

@app.route('/api/ml/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        print("\n" + "="*60)
        print("NEW PREDICTION REQUEST")
        print("="*60)

        adoptions = data.get('adoptions', [])
        view_mode = data.get('viewMode', 'daily')

        print(f"View mode: {view_mode}")
        print(f"Total adoptions in request: {len(adoptions)}")

        # Determine periods based on view mode
        if view_mode == 'daily':
            periods = 30
            aggregation = 'daily'
        elif view_mode == 'weekly':
            periods = 12
            aggregation = 'weekly'
        elif view_mode == 'monthly':
            periods = 3
            aggregation = 'monthly'
        else:
            periods = 30
            aggregation = 'daily'

        print(f"Aggregation: {aggregation}")
        print(f"Periods to predict: {periods}")

        # Check if enough data (already filtered by backend)
        if len(adoptions) < 7:
            error_msg = 'Not enough data for predictions (minimum 7 approved adoptions required)'
            print(f"ERROR: {error_msg}")
            return jsonify({
                'error': error_msg
            }), 400

        # Generate predictions
        result = predictor.train_and_predict_advanced(adoptions, periods, aggregation)

        print("\n" + "="*60)
        print("PREDICTION SUCCESS")
        print("="*60 + "\n")

        return jsonify(result)

    except ValueError as e:
        error_msg = str(e)
        print(f"\nVALUE ERROR: {error_msg}\n")
        return jsonify({
            'error': error_msg
        }), 400
    except Exception as e:
        print(f"\nUNEXPECTED ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'ML Prediction Service',
        'version': '1.0.0'
    })

# ── Animal Description Generator ──────────────────────────────────────────────

class AnimalDescriptionGenerator:
    def __init__(self):
        self.templates = {
            'opening': {
                'found_street': [
                    "Found wandering on the streets of {city}, this {size} {type} is now looking for a loving home.",
                    "Spotted alone near {city}, this gentle {type} needs someone to give them a fresh start.",
                    "Rescued from the streets of {city}, this {type} has shown incredible resilience and warmth.",
                ],
                'owner_surrender': [
                    "Through no fault of their own, this {size} {type} needs a new family to call their own.",
                    "This {type} is looking for a new home after their previous family could no longer care for them.",
                ],
                'rescued': [
                    "After being rescued from a difficult situation, this brave {type} is ready for a safe home.",
                    "This resilient {type} was rescued and is now ready to experience what a loving home feels like.",
                ],
                'default': [
                    "This wonderful {size} {type} is currently looking for a forever home.",
                    "Meet this lovely {type} who is ready to bring joy to a new family.",
                ]
            },
            'health': {
                'vaccinated': "They are fully vaccinated and in good health, ready for adoption.",
                'partially_vaccinated': "Partially vaccinated and in good overall condition.",
                'not_vaccinated': "They will need vaccinations upon adoption — a small investment for a lifetime of companionship.",
                'unknown_health': "Their health status is being assessed by local volunteers.",
                'urgent': "This animal needs urgent care and a loving home as soon as possible.",
            },
            'microchip': {
                'yes': "Already microchipped for your peace of mind.",
                'no': "Not yet microchipped, but this can be arranged.",
                'unknown': "",
            },
            'neutered': {
                'yes': "Neutered/spayed.",
                'no': "Not yet neutered — this is recommended after adoption.",
                'unknown': "",
            },
            'age': {
                'Under 3 months': "At just a few months old, they have their whole life ahead of them and will adapt quickly to a new home.",
                '3-12 months': "Still young and full of energy, they are at the perfect age to bond with a new family.",
                '1-3 years': "At a lovely young adult age, they have the perfect balance of playfulness and calm.",
                '3-7 years': "A mature and settled companion, they are calm, gentle and fully developed in personality.",
                'Over 7 years': "A wise and gentle soul, older animals make incredibly loyal and calm companions.",
                'Unknown': "",
            },
            'closing': [
                "If you can offer this animal a loving home, please reach out through Paws.",
                "Interested in giving them a forever home? Contact the uploader through Paws today.",
                "Could you be the family they have been waiting for? Reach out through Paws.",
                "Every animal deserves a front page — and a loving home. Contact us today.",
            ]
        }

    def calculate_urgency_score(self, data):
        score = 0
        if data.get('status') == 'Needs urgent care':
            score += 3
        if data.get('vaccinated') in ['No', 'Unknown']:
            score += 1
        if data.get('age') == 'Under 3 months':
            score += 2
        if data.get('microchip') == 'No':
            score += 1
        return score

    def select_template(self, templates_list, seed=None):
        import random
        if seed:
            random.seed(hash(seed) % 1000)
        return random.choice(templates_list)

    def generate(self, data):
        import random
        animal_type = (data.get('type') or 'animal').lower()
        size = (data.get('size') or '').lower()
        found_how = data.get('foundHow') or 'default'
        vaccinated = data.get('vaccinated') or 'unknown'
        microchip = data.get('microchip') or 'unknown'
        neutered = data.get('neutered') or 'unknown'
        age = data.get('age') or 'Unknown'
        status = data.get('status') or ''

        # Time-based seed for variation on every call
        random.seed(int(time.time() * 1000) % 10000)

        found_key = 'default'
        if 'street' in found_how.lower() or 'stray' in found_how.lower():
            found_key = 'found_street'
        elif 'surrender' in found_how.lower() or 'owner' in found_how.lower():
            found_key = 'owner_surrender'
        elif 'rescue' in found_how.lower():
            found_key = 'rescued'

        size_map = {
            'very small (under 5kg)': 'very small', 'small (5-10kg)': 'small',
            'medium (10-25kg)': 'medium-sized', 'large (over 25kg)': 'large', 'unknown': ''
        }
        size_str = size_map.get(size, size)

        opening_tpl = random.choice(self.templates['opening'].get(found_key, self.templates['opening']['default']))
        opening = opening_tpl.format(type=animal_type, size=size_str, city='Timișoara').strip()
        opening = ' '.join(opening.split())

        parts = [opening]

        # Age sentence
        age_map = {
            'Under 3 months': 'Just a few months old, this little one will adapt quickly to a loving home.',
            '3-12 months':    'Still young at under a year old, full of energy and ready to bond.',
            '1-3 years':      f'At {age.lower()}, they have the perfect balance of playfulness and calm.',
            '3-7 years':      f'A settled adult at {age.lower()}, calm and fully developed in character.',
            'Over 7 years':   'A wise and gentle soul — older animals make incredibly loyal companions.',
        }
        if age in age_map:
            parts.append(age_map[age])

        # Health sentence — combine vaccinated + neutered + microchip
        health_parts = []
        if vaccinated == 'Yes, fully':
            health_parts.append('fully vaccinated')
        elif vaccinated == 'Partially':
            health_parts.append('partially vaccinated')
        elif vaccinated == 'No':
            health_parts.append('not yet vaccinated (will need vaccines upon adoption)')

        if neutered == 'Yes':
            health_parts.append('neutered/spayed')
        elif neutered == 'No':
            health_parts.append('not yet neutered')

        if microchip == 'Yes':
            health_parts.append('microchipped')
        elif microchip == 'No':
            health_parts.append('not yet microchipped')

        if health_parts:
            parts.append(f'Health status: {", ".join(health_parts)}.')
        else:
            parts.append('Health status is currently being assessed by volunteers.')

        if status == 'Needs urgent care':
            parts.append('This animal needs urgent care and a loving home as soon as possible — please reach out today.')

        parts.append(random.choice(self.templates['closing']))

        description = ' '.join(parts)
        urgency = self.calculate_urgency_score(data)
        return description, urgency

description_generator = AnimalDescriptionGenerator()

@app.route('/api/ml/generate-description', methods=['POST'])
def generate_description():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        description, urgency_score = description_generator.generate(data)

        return jsonify({
            'description': description,
            'urgency_score': urgency_score,
            'model': 'template-nlp-v1'
        })
    except Exception as e:
        print(f"Description generation error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/generate-description/health', methods=['GET'])
def description_health():
    return jsonify({'status': 'ok', 'endpoint': 'generate-description'})

@app.route('/api/ml/analyse-image', methods=['POST'])
def analyse_image():
    if not CLIP_AVAILABLE:
        return jsonify({'error': 'CLIP not installed. Run: pip install torch transformers Pillow'}), 503
    try:
        import torch
        from PIL import Image
        import base64
        import io

        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400

        image_data = data['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

        model, processor = load_clip()
        results = {}

        # 1. Species
        species_options = ["a photo of a dog", "a photo of a cat", "a photo of a puppy", "a photo of a kitten", "a photo of a rabbit", "a photo of another animal"]
        inputs = processor(text=species_options, images=image, return_tensors="pt", padding=True)
        with torch.no_grad():
            outputs = model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)[0]
        top_idx = probs.argmax().item()
        species = species_options[top_idx]
        results['species'] = {'value': species, 'confidence': round(probs[top_idx].item() * 100, 1)}

        is_dog = 'dog' in species or 'puppy' in species
        is_cat = 'cat' in species or 'kitten' in species

        # 2. Breed
        if is_dog:
            breed_options = ["a golden retriever", "a german shepherd", "a labrador retriever", "a french bulldog", "a poodle", "a siberian husky", "a beagle", "a chihuahua", "a dachshund", "a pug", "a rottweiler", "a border collie", "a corgi", "a pitbull", "a mixed breed dog", "a mutt"]
        elif is_cat:
            breed_options = ["a persian cat", "a siamese cat", "a maine coon cat", "a british shorthair cat", "a bengal cat", "a ragdoll cat", "a tabby cat", "a domestic shorthair cat", "a mixed breed cat"]
        else:
            breed_options = []

        if breed_options:
            inputs = processor(text=breed_options, images=image, return_tensors="pt", padding=True)
            with torch.no_grad():
                outputs = model(**inputs)
            probs = outputs.logits_per_image.softmax(dim=1)[0]
            top_idx = probs.argmax().item()
            breed_conf = probs[top_idx].item() * 100
            if breed_conf > 30:
                results['breed'] = {'value': breed_options[top_idx], 'confidence': round(breed_conf, 1)}

        # 3. Color
        color_options = ["a brown animal", "a white animal", "a black animal", "a gray animal", "an orange animal", "a golden animal", "a cream colored animal", "a black and white animal", "a multicolored animal"]
        inputs = processor(text=color_options, images=image, return_tensors="pt", padding=True)
        with torch.no_grad():
            outputs = model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)[0]
        top_idx = probs.argmax().item()
        results['color'] = {'value': color_options[top_idx], 'confidence': round(probs[top_idx].item() * 100, 1)}

        # 4. Size
        size_options = ["a very small animal under 5kg", "a small animal 5 to 10kg", "a medium sized animal 10 to 25kg", "a large animal over 25kg"]
        inputs = processor(text=size_options, images=image, return_tensors="pt", padding=True)
        with torch.no_grad():
            outputs = model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)[0]
        top_idx = probs.argmax().item()
        size_map_result = {0: 'Very small (under 5kg)', 1: 'Small (5-10kg)', 2: 'Medium (10-25kg)', 3: 'Large (over 25kg)'}
        results['size'] = {'value': size_map_result[top_idx], 'confidence': round(probs[top_idx].item() * 100, 1)}

        # 5. Age
        age_options = ["a very young puppy or kitten under 3 months", "a young animal 3 to 12 months old", "a young adult animal 1 to 3 years old", "a mature adult animal 3 to 7 years old", "an older senior animal over 7 years old"]
        inputs = processor(text=age_options, images=image, return_tensors="pt", padding=True)
        with torch.no_grad():
            outputs = model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)[0]
        top_idx = probs.argmax().item()
        age_map_result = {0: 'Under 3 months', 1: '3-12 months', 2: '1-3 years', 3: '3-7 years', 4: 'Over 7 years'}
        results['age'] = {'value': age_map_result[top_idx], 'confidence': round(probs[top_idx].item() * 100, 1)}

        # 6. Fur
        fur_options = ["a short haired animal", "a medium haired animal", "a long haired fluffy animal", "a hairless animal"]
        inputs = processor(text=fur_options, images=image, return_tensors="pt", padding=True)
        with torch.no_grad():
            outputs = model(**inputs)
        probs = outputs.logits_per_image.softmax(dim=1)[0]
        top_idx = probs.argmax().item()
        fur_labels = ['Short hair', 'Medium hair', 'Long hair', 'Hairless']
        results['fur'] = {'value': fur_labels[top_idx], 'confidence': round(probs[top_idx].item() * 100, 1)}

        type_str = 'dog' if is_dog else ('cat' if is_cat else 'other')

        return jsonify({
            'success': True,
            'results': results,
            'summary': {
                'type':               type_str,
                'breed':              results.get('breed', {}).get('value', '').replace('a ', '').replace('an ', ''),
                'color':              results.get('color', {}).get('value', '').replace('a ', '').replace('an ', ''),
                'size':               results.get('size', {}).get('value', ''),
                'age':                results.get('age', {}).get('value', ''),
                'fur':                results.get('fur', {}).get('value', ''),
                'species_confidence': results.get('species', {}).get('confidence', 0),
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("ML PREDICTION SERVICE STARTING")
    print("="*60)
    print("Host: 0.0.0.0")
    print("Port: 5001")
    print("="*60 + "\n")

    app.run(host='0.0.0.0', port=5001, debug=True)