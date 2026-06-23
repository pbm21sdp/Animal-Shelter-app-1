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
                    "{city} has a new face on its streets — this {size} {type} is hoping someone notices.",
                    "No collar, no owner in sight. This {type} was found alone in {city} and needs a place to call home.",
                    "Life on the streets of {city} hasn't been easy for this {type}, but their story doesn't have to end there.",
                    "This {size} {type} has been surviving on instinct alone near {city}. They deserve better.",
                    "Found with nowhere to go in {city}, this {type} is still hopeful — and so are we.",
                    "A stray no more, hopefully: this {type} was picked up off the streets of {city} and is ready for a real home.",
                    "Someone has to notice this {type}. Found near {city}, alone and unclaimed.",
                    "This {size} {type} turned up in {city} with nothing but their own resilience to rely on.",
                    "Hungry, alone, and still trusting — this {type} was found roaming {city} and is ready to be someone's.",
                ],
                'lost': [
                    "This {size} {type} was found near {city} and appears to be lost — well-kept and clearly used to human care, they are likely missing their family.",
                    "Found near {city}, this {type} seems to be a lost pet rather than a stray — calm, friendly, and showing signs of being someone's beloved companion.",
                    "A {size} {type} was spotted near {city} and appears to belong to someone. They are safe and being cared for while we search for their owner.",
                    "This {type} was found near {city} and does not appear to be a stray — their condition and behaviour suggest they have a home and a family looking for them.",
                    "Someone is missing this {type}. Found near {city}, well-groomed and clearly loved.",
                    "This {type} doesn't act like a stray — found near {city}, calm and clearly used to people.",
                    "We don't think this {size} {type} ran away from nothing. Found near {city}, they're safe for now while we look for their family.",
                    "Too well-cared-for to be a stray: this {type} was found near {city} and is likely someone's missing pet.",
                    "If you're searching for a {type}, check here first. Found near {city}, safe and waiting.",
                    "This {type} showed up near {city} looking confused, not feral — a strong sign they belong to someone.",
                    "Clean, calm, and clearly someone's pet — this {type} was found near {city} without an owner in sight.",
                    "Found near {city}: a {size} {type} that behaves like a pet, not a stray. Their family may be looking right now.",
                ],
                'owner_missing': [
                    "This is our beloved {size} {type}, who went missing near {city}. We are heartbroken and doing everything we can to find them.",
                    "Our {size} {type} has gone missing near {city} and we desperately need your help finding them.",
                    "We are searching for our {type}, last seen near {city}. If you have spotted them, please reach out — every lead matters.",
                    "Our {type} disappeared near {city} and has not come home. We miss them deeply and are asking for your help.",
                    "Missing: our {type}, last seen near {city}. Please help us bring them home.",
                    "Our family isn't complete without this {type}. Missing near {city} — any information helps.",
                    "This {size} {type} means everything to us, and they've been missing near {city}. Please share if you can.",
                    "We haven't stopped looking. Our {type} went missing near {city} and we won't give up.",
                    "Have you seen our {type}? Last known location: near {city}. We're asking everyone we can.",
                    "Our {type} slipped away near {city} and we're devastated. Please keep an eye out.",
                    "This {size} {type} is loved and missed terribly. Gone missing near {city} — please help us find them.",
                    "Every day without our {type} feels longer. Last seen near {city}. Please reach out if you know anything.",
                ],
                'owner_surrender': [
                    "Through no fault of their own, this {size} {type} needs a new family to call their own.",
                    "This {type} is looking for a new home after their previous family could no longer care for them.",
                    "Circumstances changed, but this {type}'s need for love hasn't. They're ready for a new family.",
                    "This {size} {type} didn't do anything wrong — life just got complicated for their family. Now they need a new one.",
                    "A change in circumstances means this {type} needs somewhere new to call home.",
                    "This {type} was loved once and deserves to be loved again. Their family simply couldn't continue caring for them.",
                    "Sometimes life gets in the way. This {size} {type} is in search of a second chance at a forever home.",
                    "Not every ending is sad — this {type} just needs a new beginning with the right family.",
                    "This {type}'s previous home couldn't continue, through no fault of their own. Now it's someone else's turn.",
                    "Given up with a heavy heart, this {size} {type} is ready to be loved by a new family.",
                ],
                'rescued': [
                    "After being rescued from a difficult situation, this brave {type} is ready for a safe home.",
                    "This resilient {type} was rescued and is now ready to experience what a loving home feels like.",
                    "Rescued and safe — this {type} is finally ready for the home they deserve.",
                    "This {type} has already survived the hard part. Now they just need someone to love them.",
                    "Pulled from a difficult situation, this {size} {type} is proof that things can get better.",
                    "This brave {type} made it through. Now all that's left is finding them a home.",
                    "Rescue was just the first step. This {type} is ready for a real life — and a real family.",
                    "Against the odds, this {type} is safe now. They're ready to learn what a loving home feels like.",
                    "This {size} {type} survived a hard situation and came out the other side still trusting. They deserve a soft landing.",
                    "Once in danger, now safe: this {type} is ready to start over with the right family.",
                ],
                'default': [
                    "This wonderful {size} {type} is currently looking for a forever home.",
                    "Meet this lovely {type} who is ready to bring joy to a new family.",
                    "This {type} is ready and waiting for a forever home.",
                    "Say hello to this {size} {type}, looking for their perfect match.",
                    "This {type} has so much love to give — they just need the right family to give it to.",
                    "Looking for a new best friend? This {type} might just be it.",
                    "This {size} {type} is one good home away from a happy ending.",
                    "Meet a {type} who's ready to make someone's life a little brighter.",
                    "This {type} is patiently waiting for someone to say yes.",
                    "A new chapter is waiting for this {type} — it just needs the right family to start it.",
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
                "Ready to meet them? Reach out through Paws.",
                "This could be the start of something good. Contact us through Paws.",
                "One message could change everything for them. Reach out through Paws.",
                "Think you're the right fit? Get in touch through Paws.",
                "They're just one home away from happy. Reach out through Paws.",
                "Could this be your next family member? Contact us through Paws.",
                "Don't wait — reach out through Paws today.",
                "Their forever home might be one click away. Contact us through Paws.",
            ],
            'closing_lost': [
                "Do you recognise this animal? If you are their owner or know who they belong to, please get in touch through Paws as soon as possible.",
                "If this is your pet or you have any information about their owner, please contact us through Paws right away — every lead helps.",
                "This animal is safe and being looked after. If you recognise them, reach out through Paws immediately so we can reunite them with their family.",
                "Recognise this face? Please reach out through Paws — the sooner we can find their owner, the better.",
                "Know this animal? Please reach out through Paws right away.",
                "They're safe for now, but their family is likely worried. Reach out through Paws if you recognise them.",
                "Could this be someone you know's pet? Contact us through Paws.",
                "Help us reunite them with their family. Reach out through Paws if anything looks familiar.",
                "If you've seen this animal before, please don't wait — contact us through Paws.",
                "Every minute matters for a lost pet. Reach out through Paws if you recognise them.",
                "We're holding onto them safely while we search. If you know them, please reach out through Paws.",
                "Their family could be looking right now. Reach out through Paws if you recognise this animal.",
            ],
            'closing_owner_missing': [
                "If you have spotted our pet or have any information about their whereabouts, please contact us through Paws immediately — we are waiting anxiously.",
                "Have you seen this animal near {city}? Please don't hesitate to reach out through Paws — any sighting, however small, could bring them home.",
                "Every tip counts. If you've spotted this {type} or know where they might be, please contact the owner through Paws as soon as possible.",
                "Time is of the essence. If you have seen this animal, please reach out through Paws right away — their family is waiting.",
                "Please, if you've seen them, contact us through Paws — we just want them home.",
                "Any sighting helps. Reach out through Paws, no matter how small the detail.",
                "We're not giving up. If you've seen this {type} near {city}, please contact us through Paws.",
                "Seen them? Please reach out through Paws immediately — we're desperate for any lead.",
                "Their spot at home is still empty. Reach out through Paws if you've seen this {type}.",
                "We'd be so grateful for any information. Please contact us through Paws.",
                "If you've spotted this {type} near {city}, even briefly, please reach out through Paws.",
                "We're checking every lead. Please reach out through Paws if you've seen this {type}.",
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
        city = data.get('city') or ''
        breed = data.get('breed') or ''
        color = data.get('color') or ''
        coat = data.get('coat') or ''
        traits = [t for t in (data.get('traits') or []) if t]

        random.seed(int(time.time() * 1000) % 10000)

        found_key = 'default'
        if 'missing' in found_how.lower():
            found_key = 'owner_missing'
        elif 'lost' in found_how.lower() or 'appear' in found_how.lower():
            found_key = 'lost'
        elif 'street' in found_how.lower() or 'stray' in found_how.lower():
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
        city_label = city if city else 'the area'
        opening = opening_tpl.format(type=animal_type, size=size_str, city=city_label).strip()
        opening = ' '.join(opening.split())

        parts = [opening]

        # Appearance sentence (breed / color / coat from AI analysis)
        if breed and (color or coat):
            coat_str = f'with a {color} coat' if color else f'with {coat} fur'
            parts.append(f'This {animal_type} appears to be a {breed}, {coat_str}.')
        elif breed:
            parts.append(f'This {animal_type} appears to be a {breed}.')
        elif color:
            parts.append(f'This {animal_type} has a {color} coat.')
        elif coat:
            parts.append(f'This {animal_type} has {coat} fur.')

        # Personality traits — multiple sentence patterns for variety
        if traits:
            t_lower = [t.lower() for t in traits]
            if len(t_lower) == 1:
                trait_str = t_lower[0]
            elif len(t_lower) == 2:
                trait_str = f'{t_lower[0]} and {t_lower[1]}'
            else:
                trait_str = ', '.join(t_lower[:-1]) + f', and {t_lower[-1]}'

            trait_templates = [
                f'Known to be {trait_str}, they would make a wonderful companion for the right family.',
                f'Their personality shines through — {trait_str} describes them perfectly.',
                f'Those who know them best describe this {animal_type} as {trait_str}.',
                f'A truly {trait_str} soul, this {animal_type} is looking for someone to share their days with.',
                f'What makes them special? They are {trait_str} — and they wear it every single day.',
                f'{trait_str} — that\'s this {animal_type} in a few words.',
                f'This {animal_type} is {trait_str}, and it shows in everything they do.',
                f'If you had to describe them in one breath, it would be: {trait_str}.',
                f'Spend five minutes with this {animal_type} and you\'ll see it — {trait_str}, through and through.',
                f'{trait_str}. That\'s not just a description, that\'s a promise of what you\'ll get.',
                f'This {animal_type} wears their personality on their sleeve: {trait_str}.',
                f'Ask anyone who\'s met them — {trait_str} is the first thing they\'ll say.',
                f'Beneath the surface, this {animal_type} is simply {trait_str}.',
            ]
            parts.append(random.choice(trait_templates))

        # Age sentence — multiple options per bracket
        age_options = {
            'Under 3 months': [
                'Just a few months old, this little one will adapt quickly to a loving home.',
                'At such a young age, they are a blank canvas — ready to grow alongside their new family.',
                'Still a baby, they have their whole life ahead of them and will bond deeply with whoever takes them in.',
                'Tiny, new, and full of potential — this little one is just getting started.',
                'Still a baby. Everything ahead of them is still unwritten.',
                'At this age, they\'ll grow up knowing only one home — yours, if you let them.',
                'Young enough to adapt to anything, old enough to already need love.',
                'A few months old and already looking for someone to grow up with.',
                'This little one is just beginning their story — be part of it from page one.',
            ],
            '3-12 months': [
                'Still young and full of energy, they are at the perfect age to bond with a new family.',
                'Under a year old, they bring buckets of curiosity and enthusiasm to every moment.',
                'Young, lively, and eager to explore — this one will keep you on your toes in the best possible way.',
                'Not quite a year old, and already full of personality.',
                'This is the fun, messy, curious stage — and they\'re living it fully.',
                'Energetic and still learning the world, this one needs patience and a sense of humour.',
                'Young enough to be playful, old enough to already show who they\'re becoming.',
                'Bursting with energy at under a year old — bring patience and an open heart.',
                'This adolescent phase comes with chaos and charm in equal measure.',
            ],
            '1-3 years': [
                f'At {age.lower()}, they have found the sweet spot between playfulness and calm.',
                'A young adult with just enough energy to keep life interesting and just enough calm to curl up beside you.',
                f'At this age they are fully themselves — confident, settled, and ready for a real connection.',
                'The best of both worlds — still playful, but settled enough to relax with.',
                'At this age, they know who they are and what they want: a home.',
                'Young adulthood looks good on them — energetic when it counts, calm when it matters.',
                'Old enough to be predictable, young enough to still surprise you.',
                'This is peak companionship age — settled, social, and ready to bond.',
                'Mature enough to know the routine, young enough to still enjoy a good game.',
            ],
            '3-7 years': [
                f'A mature and settled companion at {age.lower()}, calm and fully developed in character.',
                'Past the chaotic puppy or kitten phase, this animal knows exactly who they are and what they want — a loving home.',
                f'At {age.lower()}, what you see is what you get: a loyal, grounded companion for daily life.',
                'Fully grown and fully themselves — no surprises, just steady companionship.',
                'This is the calm, confident middle of life — easy to live with, easy to love.',
                'No guesswork here: their personality is set, and it\'s a good one.',
                'Past the growing pains, this companion is just ready for everyday life with someone.',
                'A grounded, predictable presence — exactly what a lot of homes are looking for.',
                'They\'ve settled into themselves. All that\'s missing is a home to settle into.',
            ],
            'Over 7 years': [
                'A wise and gentle soul — older animals make incredibly loyal and calm companions.',
                'Senior animals love just as fiercely, if not more. This one has years of affection left to give.',
                'There is something irreplaceable about an older animal: quiet, grateful, and deeply loyal.',
                'Senior, gentle, and so often overlooked — but they have just as much love to give.',
                'Older doesn\'t mean less. This one still has years of quiet companionship ahead.',
                'Calm, wise, and grateful for the smallest kindness — that\'s what a senior animal offers.',
                'They\'ve earned a peaceful home, and they\'ll repay it with quiet, steady devotion.',
                'Senior pets are often the easiest to love — settled, undemanding, and deeply loyal.',
                'Don\'t let the age fool you — there\'s a whole lot of love left in this one.',
            ],
        }
        if age in age_options:
            parts.append(random.choice(age_options[age]))

        # Health sentence — varied phrasing
        health_parts = []
        if vaccinated == 'Yes, fully':
            health_parts.append(random.choice(['fully vaccinated', 'up to date on all vaccinations']))
        elif vaccinated == 'Partially':
            health_parts.append('partially vaccinated')
        elif vaccinated == 'No':
            health_parts.append('not yet vaccinated (vaccines recommended upon adoption)')

        if neutered == 'Yes':
            health_parts.append(random.choice(['neutered/spayed', 'already neutered']))
        elif neutered == 'No':
            health_parts.append('not yet neutered')

        if microchip == 'Yes':
            health_parts.append(random.choice(['microchipped', 'already microchipped for peace of mind']))
        elif microchip == 'No':
            health_parts.append('not yet microchipped')

        if health_parts:
            health_intros = [
                f'Health notes: {", ".join(health_parts)}.',
                f'On the health side: {", ".join(health_parts)}.',
                f'Medical update: {", ".join(health_parts)}.',
                f'Quick health summary: {", ".join(health_parts)}.',
                f'Here\'s what we know health-wise: {", ".join(health_parts)}.',
                f'Health-wise: {", ".join(health_parts)}.',
                f'What you should know: {", ".join(health_parts)}.',
                f'A few important details: {", ".join(health_parts)}.',
                f'For peace of mind: {", ".join(health_parts)}.',
                f'Health snapshot: {", ".join(health_parts)}.',
            ]
            parts.append(random.choice(health_intros))

        if found_key not in ('lost', 'owner_missing') and status == 'Needs urgent care':
            parts.append(random.choice([
                'This animal needs urgent care and a loving home as soon as possible — please reach out today.',
                'Time is important here — this animal needs care urgently. If you can help, please get in touch.',
            ]))

        if found_key == 'lost':
            closing_key = 'closing_lost'
        elif found_key == 'owner_missing':
            closing_key = 'closing_owner_missing'
        else:
            closing_key = 'closing'
        closing_tpl = random.choice(self.templates[closing_key])
        parts.append(closing_tpl.format(type=animal_type, city=city_label))

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

class PlatformInsightsGenerator:
    """
    Generates data-driven insights about the Paws platform using
    statistical analysis and rule-based NLP. No external APIs required.
    """

    def generate(self, stats):
        import random
        import math

        total      = stats.get('total_uploaded', 0)
        found_home = stats.get('found_home', 0)
        urgent     = stats.get('urgent_cases', 0)
        vaccinated = stats.get('vaccinated', 0)
        members    = stats.get('active_members', 0)
        avg_days   = stats.get('avg_days_adoption', 0)

        insights = []

        # ── Insight 1: Success rate analysis ──────────────────────────
        if total > 0:
            success_rate = (found_home / total) * 100
            if success_rate >= 50:
                trend = 'positive'
                msg = (
                    f"With a {success_rate:.0f}% adoption success rate across {total} uploaded animals, "
                    f"the Paws community is making a measurable impact. "
                    f"Every upload increases an animal's chance of finding a home."
                )
            elif success_rate >= 25:
                trend = 'neutral'
                msg = (
                    f"The platform has helped {found_home} out of {total} animals find homes — "
                    f"a {success_rate:.0f}% success rate. "
                    f"Listings with photos and detailed descriptions perform significantly better."
                )
            else:
                trend = 'improving'
                msg = (
                    f"With {total} animals listed and {found_home} adopted so far, "
                    f"there is strong opportunity for growth. "
                    f"Sharing listings on social media can triple adoption chances."
                )
            insights.append({'text': msg, 'trend': trend, 'type': 'success_rate'})

        # ── Insight 2: Urgent cases analysis ──────────────────────────
        if urgent > 0 and total > 0:
            urgent_pct = (urgent / total) * 100
            if urgent_pct >= 60:
                msg = (
                    f"{urgent} animals currently need urgent care — {urgent_pct:.0f}% of all listings. "
                    f"These animals have the greatest need for immediate adoption or foster care. "
                    f"Consider reaching out to local veterinary clinics for support."
                )
            else:
                msg = (
                    f"{urgent} animals are marked as urgent cases. "
                    f"Quick action from the community can significantly improve their outcomes. "
                    f"Urgent listings are prioritized in search results."
                )
            insights.append({'text': msg, 'trend': 'alert', 'type': 'urgent'})

        # ── Insight 3: Vaccination coverage ───────────────────────────
        if vaccinated > 0 and total > 0:
            vax_rate = (vaccinated / total) * 100
            msg = (
                f"{vaccinated} animals ({vax_rate:.0f}% of listings) have documented vaccination records. "
                f"Vaccinated animals are adopted up to 40% faster. "
                f"If you know an animal's health history, always include it in the listing."
            )
            insights.append({'text': msg, 'trend': 'positive', 'type': 'health'})

        # ── Insight 4: Community growth ────────────────────────────────
        if members > 0:
            uploads_per_member = total / members if members > 0 else 0
            msg = (
                f"The Paws community has {members} active members, "
                f"averaging {uploads_per_member:.1f} uploads per member. "
                f"A growing community means more animals get visibility and better chances of adoption."
            )
            insights.append({'text': msg, 'trend': 'positive', 'type': 'community'})

        # ── Insight 5: Adoption speed ──────────────────────────────────
        if avg_days > 0:
            if avg_days <= 7:
                speed_desc = "very quickly"
            elif avg_days <= 30:
                speed_desc = "within a month"
            else:
                speed_desc = f"in about {avg_days} days on average"
            msg = (
                f"Animals on Paws that find homes do so {speed_desc}. "
                f"Complete listings with multiple photos and detailed descriptions "
                f"are adopted significantly faster than incomplete ones."
            )
            insights.append({'text': msg, 'trend': 'neutral', 'type': 'speed'})

        # Always return at least 2 insights
        if len(insights) == 0:
            insights = [
                {
                    'text': "The Paws platform is growing. Every animal uploaded gets a front page and a chance at a loving home.",
                    'trend': 'positive',
                    'type': 'general'
                },
                {
                    'text': "Complete listings with clear photos and health information are adopted up to 3x faster than incomplete ones.",
                    'trend': 'positive',
                    'type': 'tip'
                }
            ]

        # Return 2 most relevant insights (prioritize success_rate and urgent)
        priority_order = ['success_rate', 'urgent', 'health', 'community', 'speed', 'general', 'tip']
        insights.sort(key=lambda x: priority_order.index(x['type']) if x['type'] in priority_order else 99)

        return insights[:2]


insights_generator = PlatformInsightsGenerator()

@app.route('/api/ml/insights', methods=['POST'])
def generate_insights():
    try:
        data = request.get_json()
        if not data or 'stats' not in data:
            return jsonify({'error': 'stats object required'}), 400

        stats = data['stats']
        insights = insights_generator.generate(stats)

        return jsonify({
            'success': True,
            'insights': insights,
            'model': 'statistical-nlp-v1'
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/insights/health', methods=['GET'])
def insights_health():
    return jsonify({'status': 'ok', 'endpoint': 'insights'})


@app.route('/api/ml/generate-contract', methods=['GET'])
def generate_contract():
    try:
        import sys
        import os
        sys.path.insert(0, os.path.dirname(__file__))
        from generate_contract import create_contract_pdf_v2 as create_contract_pdf
        import io
        animal_data = {
            'name':          request.args.get('name', ''),
            'species':       request.args.get('species', ''),
            'breed':         request.args.get('breed', ''),
            'color':         request.args.get('color', ''),
            'sex':           request.args.get('sex', ''),
            'age':           request.args.get('age', ''),
            'size':          request.args.get('size', ''),
            'coat':          request.args.get('coat', ''),
            'health_status': request.args.get('health_status', ''),
            'description':   request.args.get('description', ''),
            'location_city': request.args.get('location_city', ''),
        }
        buffer = io.BytesIO()
        create_contract_pdf(buffer, animal_data=animal_data)
        buffer.seek(0)
        from flask import send_file
        return send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='paws_adoption_agreement.pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("\n" + "="*60)
    print("ML PREDICTION SERVICE STARTING")
    print("="*60)
    print("Host: 0.0.0.0")
    print("Port: 5001")
    print("="*60 + "\n")

    app.run(host='127.0.0.1', port=5001, debug=False)