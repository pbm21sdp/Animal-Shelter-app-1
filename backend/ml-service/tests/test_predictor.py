"""
Unit tests for AdoptionPredictor and load_clip.

Part 2  — prepare_data
Part 3  — simple_prediction (fallback, determinism, CI, confidence thresholds)
Part 4  — train_and_predict_advanced (ETS model selection, fallback on exception)
Part 5  — load_clip (lazy loading, fine-tuned vs base-model fallback)

All tests run WITHOUT loading real CLIP weights; conftest.py injects lightweight
MagicMock objects for torch / transformers before app.py is ever imported.
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock


# ─── Test helpers ─────────────────────────────────────────────────────────────

def make_adoptions(n, start="2024-01-01", gap_days=1):
    """Generate n adoption dicts with a 'createdAt' ISO timestamp."""
    base = datetime.strptime(start, "%Y-%m-%d")
    return [
        {"createdAt": (base + timedelta(days=i * gap_days)).isoformat()}
        for i in range(n)
    ]


def make_df(n_rows, y_value=3, start="2024-01-01"):
    """Build a pre-aggregated daily DataFrame (cols: ds, y) with uniform counts."""
    dates = pd.date_range(start=start, periods=n_rows, freq="D")
    return pd.DataFrame({"ds": dates, "y": [float(y_value)] * n_rows})


# ══════════════════════════════════════════════════════════════════════════════
# Part 2 — AdoptionPredictor.prepare_data
# ══════════════════════════════════════════════════════════════════════════════

class TestPrepareData:
    """
    prepare_data(adoptions, aggregation) converts raw adoption records to a
    time-indexed DataFrame with columns ['ds', 'y'], filling zero-count
    periods so the series is gapless.
    """

    def test_columns_are_ds_and_y(self, predictor):
        df = predictor.prepare_data(make_adoptions(10), "daily")
        assert list(df.columns) == ["ds", "y"]

    def test_daily_total_count_preserved(self, predictor):
        df = predictor.prepare_data(make_adoptions(10), "daily")
        assert int(df["y"].sum()) == 10

    def test_daily_y_dtype_is_integer(self, predictor):
        df = predictor.prepare_data(make_adoptions(10), "daily")
        assert df["y"].dtype in (np.int32, np.int64, int)

    def test_gaps_filled_with_zero(self, predictor):
        """Every other day → 10 non-zero rows, 9 zero rows, 19 total."""
        adoptions = make_adoptions(10, gap_days=2)  # days 0, 2, 4 … 18
        df = predictor.prepare_data(adoptions, "daily")
        assert len(df) == 19
        assert int((df["y"] == 0).sum()) == 9

    def test_weekly_aggregation_total_preserved(self, predictor):
        """14 consecutive daily adoptions → 2 complete weeks → total still 14."""
        df = predictor.prepare_data(make_adoptions(14, start="2024-01-01"), "weekly")
        assert int(df["y"].sum()) == 14

    def test_weekly_aggregation_period_count(self, predictor):
        """Jan 1 2024 is Monday: 14 days span exactly 2 calendar weeks."""
        df = predictor.prepare_data(make_adoptions(14, start="2024-01-01"), "weekly")
        assert len(df) == 2

    def test_monthly_aggregation_period_count(self, predictor):
        """3 batches spread across Jan, Feb, Mar → 3 monthly periods."""
        jan = make_adoptions(5, start="2024-01-15")
        feb = make_adoptions(8, start="2024-02-10")
        mar = make_adoptions(3, start="2024-03-05")
        df = predictor.prepare_data(jan + feb + mar, "monthly")
        assert len(df) == 3

    def test_monthly_aggregation_total_preserved(self, predictor):
        jan = make_adoptions(5, start="2024-01-15")
        feb = make_adoptions(8, start="2024-02-10")
        mar = make_adoptions(3, start="2024-03-05")
        df = predictor.prepare_data(jan + feb + mar, "monthly")
        assert int(df["y"].sum()) == 16

    def test_empty_input_raises(self, predictor):
        """An empty list has no 'createdAt' column → must raise any exception."""
        with pytest.raises(Exception):
            predictor.prepare_data([], "daily")

    def test_single_entry_returns_one_row(self, predictor):
        df = predictor.prepare_data([{"createdAt": "2024-06-01T10:00:00"}], "daily")
        assert len(df) == 1
        assert int(df["y"].iloc[0]) == 1


# ══════════════════════════════════════════════════════════════════════════════
# Part 3 — AdoptionPredictor.simple_prediction
# ══════════════════════════════════════════════════════════════════════════════

class TestSimplePrediction:
    """
    simple_prediction(df, periods, aggregation) is the deterministic moving-
    average fallback.  It must:
      • return identical results on repeated calls (no RNG)
      • pick the correct confidence_level branch
      • produce CI where lower <= predicted <= upper for every step
    """

    # ── Determinism ──────────────────────────────────────────────────────────

    def test_identical_results_on_repeated_call(self, predictor):
        df = make_df(10, y_value=3)
        r1 = predictor.simple_prediction(df, 5, "daily")
        r2 = predictor.simple_prediction(df, 5, "daily")
        assert r1["predictions"] == r2["predictions"]
        assert r1["lower"] == r2["lower"]
        assert r1["upper"] == r2["upper"]

    # ── Confidence level branches ─────────────────────────────────────────────

    def test_confidence_low_when_hist_mean_below_threshold(self, predictor):
        """hist_mean = 0 < 0.5 → 'low'."""
        df = make_df(10, y_value=0)
        assert predictor.simple_prediction(df, 3, "daily")["confidenceLevel"] == "low"

    def test_confidence_low_when_too_few_periods(self, predictor):
        """len(df) = 3 < 4 → 'low' regardless of mean."""
        df = make_df(3, y_value=5)
        assert predictor.simple_prediction(df, 3, "daily")["confidenceLevel"] == "low"

    def test_confidence_medium_when_mean_between_thresholds(self, predictor):
        """0.5 <= hist_mean=1.0 < 2.0, len=10 >= 4 → 'medium'."""
        df = make_df(10, y_value=1)
        assert predictor.simple_prediction(df, 3, "daily")["confidenceLevel"] == "medium"

    def test_confidence_medium_when_len_below_10(self, predictor):
        """hist_mean=5 >= 2.0 but len=8 < 10 → 'medium'."""
        df = make_df(8, y_value=5)
        assert predictor.simple_prediction(df, 3, "daily")["confidenceLevel"] == "medium"

    def test_confidence_high_when_all_thresholds_exceeded(self, predictor):
        """hist_mean=5 >= 2.0 AND len=15 >= 10 → 'high'."""
        df = make_df(15, y_value=5)
        assert predictor.simple_prediction(df, 3, "daily")["confidenceLevel"] == "high"

    # ── Confidence interval correctness ──────────────────────────────────────

    def test_ci_lower_le_predicted_le_upper_for_all_steps(self, predictor):
        """lower[i] <= predictions[i] <= upper[i] must hold for every forecast step."""
        df = make_df(15, y_value=5)
        result = predictor.simple_prediction(df, 7, "daily")
        for i, pred in enumerate(result["predictions"]):
            assert result["lower"][i] <= pred <= result["upper"][i], (
                f"CI violated at step {i}: lower={result['lower'][i]}, "
                f"pred={pred}, upper={result['upper'][i]}"
            )

    # ── Output shape and sanity ───────────────────────────────────────────────

    def test_output_contains_required_keys(self, predictor):
        df = make_df(10, y_value=2)
        result = predictor.simple_prediction(df, 5, "daily")
        for key in (
            "historicalDates", "historical",
            "predictionDates", "predictions",
            "statistics", "aggregation",
            "lower", "upper", "confidenceLevel",
        ):
            assert key in result

    def test_prediction_arrays_have_correct_length(self, predictor):
        df = make_df(10, y_value=3)
        result = predictor.simple_prediction(df, 7, "daily")
        assert len(result["predictions"]) == 7
        assert len(result["lower"]) == 7
        assert len(result["upper"]) == 7
        assert len(result["predictionDates"]) == 7

    def test_no_negative_predictions(self, predictor):
        """All forecast values must be >= 0 even for zero-mean input."""
        df = make_df(10, y_value=0)
        result = predictor.simple_prediction(df, 5, "daily")
        assert all(p >= 0 for p in result["predictions"])


# ══════════════════════════════════════════════════════════════════════════════
# Part 4 — AdoptionPredictor.train_and_predict_advanced (model selection)
# ══════════════════════════════════════════════════════════════════════════════

class TestTrainAndPredictAdvanced:
    """
    Verify that train_and_predict_advanced() picks the right ETS variant based
    on the number of time periods available, and falls back to simple_prediction
    when ExponentialSmoothing raises an exception.

    ExponentialSmoothing is patched so no real model fitting occurs; we inspect
    the constructor kwargs to confirm the correct variant was selected.
    """

    # ── Seasonal model ────────────────────────────────────────────────────────

    def test_seasonal_model_chosen_for_daily_with_enough_data(self, predictor):
        """
        20 daily adoptions → 20 periods >= 14 → daily seasonal_periods=7,
        20 >= 14 (= 7*2) → must use seasonal='add'.
        """
        adoptions = make_adoptions(20)

        with patch("app.ExponentialSmoothing") as mock_es:
            mock_fitted = MagicMock()
            mock_fitted.fittedvalues = pd.Series([1.0] * 20)
            mock_fitted.forecast.return_value = np.array([3.0] * 30)
            mock_es.return_value.fit.return_value = mock_fitted

            predictor.train_and_predict_advanced(adoptions, 30, "daily")

        kwargs = mock_es.call_args.kwargs
        assert kwargs.get("seasonal") == "add", (
            "Expected seasonal='add' for 20-period daily data"
        )
        assert kwargs.get("trend") == "add"
        assert kwargs.get("seasonal_periods") == 7

    # ── Trend-only model (no seasonality) ────────────────────────────────────

    def test_trend_only_model_chosen_for_monthly_data(self, predictor):
        """
        Monthly aggregation → seasonal_periods=None → trend-only model
        (damped_trend=True, no 'seasonal' kwarg).
        """
        adoptions = []
        for i in range(18):
            year = 2022 + (i // 12)
            month = (i % 12) + 1
            adoptions.append({"createdAt": datetime(year, month, 15).isoformat()})

        with patch("app.ExponentialSmoothing") as mock_es:
            mock_fitted = MagicMock()
            mock_fitted.fittedvalues = pd.Series([1.0] * 18)
            mock_fitted.forecast.return_value = np.array([1.0] * 3)
            mock_es.return_value.fit.return_value = mock_fitted

            predictor.train_and_predict_advanced(adoptions, 3, "monthly")

        kwargs = mock_es.call_args.kwargs
        assert "seasonal" not in kwargs, (
            "Monthly aggregation must NOT use a seasonal model"
        )
        assert kwargs.get("damped_trend") is True

    # ── Simple trend model (len < 14) ─────────────────────────────────────────

    def test_simple_trend_model_for_small_dataset(self, predictor):
        """
        10 weekly periods (8-13 range, below the len>=14 threshold) →
        ExponentialSmoothing(df['y'], trend='add') with no damped_trend or
        seasonal kwargs.
        """
        adoptions = [
            {"createdAt": (datetime(2024, 1, 1) + timedelta(weeks=w)).isoformat()}
            for w in range(10)
        ]

        with patch("app.ExponentialSmoothing") as mock_es:
            mock_fitted = MagicMock()
            mock_fitted.fittedvalues = pd.Series([1.0] * 10)
            mock_fitted.forecast.return_value = np.array([1.0] * 12)
            mock_es.return_value.fit.return_value = mock_fitted

            predictor.train_and_predict_advanced(adoptions, 12, "weekly")

        kwargs = mock_es.call_args.kwargs
        assert kwargs.get("trend") == "add"
        assert "damped_trend" not in kwargs, "Simple model must not have damped_trend"
        assert "seasonal" not in kwargs

    # ── Fallback on ETS exception ─────────────────────────────────────────────

    def test_fallback_to_simple_prediction_when_ets_fails(self, predictor):
        """When ExponentialSmoothing.fit() raises → simple_prediction is called."""
        adoptions = make_adoptions(20)

        with patch("app.ExponentialSmoothing") as mock_es:
            mock_es.return_value.fit.side_effect = Exception("Convergence failed")
            with patch.object(
                predictor, "simple_prediction", wraps=predictor.simple_prediction
            ) as spy:
                result = predictor.train_and_predict_advanced(adoptions, 30, "daily")
                assert spy.called, "simple_prediction must be the fallback when ETS fails"

        assert "predictions" in result

    # ── Insufficient data guard ────────────────────────────────────────────────

    def test_raises_value_error_for_fewer_than_7_adoptions(self, predictor):
        """< 7 adoptions → ValueError before any model is attempted."""
        with pytest.raises(ValueError, match="Not enough data"):
            predictor.train_and_predict_advanced(make_adoptions(5), 30, "daily")


# ══════════════════════════════════════════════════════════════════════════════
# Part 5 — load_clip (lazy loading and fallback)
# ══════════════════════════════════════════════════════════════════════════════

class TestLoadClip:
    """
    load_clip() lazily initialises clip_model / clip_processor globals.

    Test strategy:
    • conftest.py has already replaced sys.modules['transformers'] with a
      MagicMock so no weights are ever downloaded or loaded.
    • The autouse reset_clip_state fixture sets clip_model = None before each
      test so the lazy-load branch is always exercised.
    • os.path.exists is patched to control whether the fine-tuned config.json
      appears to exist.
    """

    def test_finetuned_model_loaded_when_config_exists(
        self, mock_transformers
    ):
        """
        Fine-tuned config present → CLIPModel.from_pretrained called with
        FINETUNED_MODEL_DIR, not the base model identifier.
        """
        import app

        with patch("os.path.exists", return_value=True):
            model, proc = app.load_clip()

        mock_transformers.CLIPModel.from_pretrained.assert_called_with(
            app.FINETUNED_MODEL_DIR
        )
        # Globals must be populated after the call
        assert app.clip_model is not None
        assert app.clip_processor is not None

    def test_base_model_loaded_when_no_finetuned_config(
        self, mock_transformers
    ):
        """
        Fine-tuned config absent (os.path.exists → False) → falls back to
        CLIPModel.from_pretrained(BASE_CLIP_MODEL).
        """
        import app

        with patch("os.path.exists", return_value=False):
            model, proc = app.load_clip()

        mock_transformers.CLIPModel.from_pretrained.assert_called_with(
            app.BASE_CLIP_MODEL
        )

    def test_base_model_fallback_when_finetuned_loading_fails(
        self, mock_transformers
    ):
        """
        Config exists but CLIPModel.from_pretrained(FINETUNED_MODEL_DIR) raises →
        catches the exception and falls back to BASE_CLIP_MODEL.
        """
        import app

        # Make the first from_pretrained call (fine-tuned dir) fail
        def _side_effect(path):
            if "clip_finetuned" in str(path):
                raise RuntimeError("Corrupt model file")
            return MagicMock(name="base_model")

        mock_transformers.CLIPModel.from_pretrained.side_effect = _side_effect
        mock_transformers.CLIPProcessor.from_pretrained.return_value = MagicMock()

        with patch("os.path.exists", return_value=True):
            model, proc = app.load_clip()

        # The last CLIPModel call must have been with the base model
        last_call_arg = mock_transformers.CLIPModel.from_pretrained.call_args[0][0]
        assert last_call_arg == app.BASE_CLIP_MODEL, (
            f"Expected fallback to BASE_CLIP_MODEL, got: {last_call_arg}"
        )

    def test_load_clip_returns_cached_model_on_second_call(
        self, mock_transformers
    ):
        """Once loaded, a second call must NOT call from_pretrained again."""
        import app

        with patch("os.path.exists", return_value=False):
            model1, proc1 = app.load_clip()
            model2, proc2 = app.load_clip()

        # from_pretrained should have been called exactly once
        assert mock_transformers.CLIPModel.from_pretrained.call_count == 1
        assert model1 is model2
