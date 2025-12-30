from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import warnings
warnings.filterwarnings('ignore')

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

if __name__ == '__main__':
    print("\n" + "="*60)
    print("ML PREDICTION SERVICE STARTING")
    print("="*60)
    print("Host: 0.0.0.0")
    print("Port: 5001")
    print("="*60 + "\n")

    app.run(host='0.0.0.0', port=5001, debug=True)