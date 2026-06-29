"""
Integration-style tests for the Flask endpoints.

Uses Flask's built-in test client — no running server required.
The conftest.py flask_client fixture provides an already-configured client.

Endpoints covered:
  GET  /health
  POST /api/ml/predict
  POST /api/ml/predict-series
"""

import pytest
from datetime import datetime, timedelta


# ─── Helper ───────────────────────────────────────────────────────────────────

def _daily_adoptions(n, start="2023-06-01"):
    """n consecutive daily adoption records."""
    base = datetime.strptime(start, "%Y-%m-%d")
    return [{"createdAt": (base + timedelta(days=i)).isoformat()} for i in range(n)]


# ══════════════════════════════════════════════════════════════════════════════
# GET /health
# ══════════════════════════════════════════════════════════════════════════════

class TestHealthEndpoint:
    def test_returns_200(self, flask_client):
        resp = flask_client.get("/health")
        assert resp.status_code == 200

    def test_response_contains_healthy_status(self, flask_client):
        data = flask_client.get("/health").get_json()
        assert data["status"] == "healthy"

    def test_response_identifies_service(self, flask_client):
        data = flask_client.get("/health").get_json()
        assert "service" in data


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/ml/predict
# ══════════════════════════════════════════════════════════════════════════════

class TestPredictEndpoint:
    def test_returns_400_when_adoptions_missing(self, flask_client):
        resp = flask_client.post("/api/ml/predict", json={})
        assert resp.status_code == 400

    def test_returns_400_when_fewer_than_7_adoptions(self, flask_client):
        resp = flask_client.post(
            "/api/ml/predict",
            json={"adoptions": _daily_adoptions(5), "viewMode": "daily"},
        )
        assert resp.status_code == 400
        assert "error" in resp.get_json()

    def test_error_message_mentions_minimum_required(self, flask_client):
        resp = flask_client.post(
            "/api/ml/predict",
            json={"adoptions": _daily_adoptions(3), "viewMode": "daily"},
        )
        data = resp.get_json()
        assert "7" in data["error"] or "minimum" in data["error"].lower()

    def test_returns_200_and_predictions_for_valid_daily_data(self, flask_client):
        """20 consecutive daily adoptions — runs real ETS, expects a valid response."""
        resp = flask_client.post(
            "/api/ml/predict",
            json={"adoptions": _daily_adoptions(20), "viewMode": "daily"},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "predictions" in data
        assert "historical" in data
        assert len(data["predictions"]) == 30  # daily viewMode → 30 periods

    def test_predictions_are_non_negative(self, flask_client):
        """Adoption counts can never be negative."""
        resp = flask_client.post(
            "/api/ml/predict",
            json={"adoptions": _daily_adoptions(20), "viewMode": "daily"},
        )
        data = resp.get_json()
        assert all(p >= 0 for p in data["predictions"])

    def test_weekly_view_returns_12_periods(self, flask_client):
        adoptions = [
            {"createdAt": (datetime(2023, 1, 2) + timedelta(weeks=w)).isoformat()}
            for w in range(15)
        ]
        resp = flask_client.post(
            "/api/ml/predict",
            json={"adoptions": adoptions, "viewMode": "weekly"},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data["predictions"]) == 12  # weekly viewMode → 12 periods

    def test_response_contains_statistics_block(self, flask_client):
        resp = flask_client.post(
            "/api/ml/predict",
            json={"adoptions": _daily_adoptions(20), "viewMode": "daily"},
        )
        data = resp.get_json()
        stats = data.get("statistics", {})
        for key in ("averageHistorical", "averagePredicted", "totalPredicted", "trend"):
            assert key in stats


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/ml/predict-series
# ══════════════════════════════════════════════════════════════════════════════

class TestPredictSeriesEndpoint:
    def test_returns_400_when_fewer_than_2_points(self, flask_client):
        resp = flask_client.post(
            "/api/ml/predict-series",
            json={"series": [{"ds": "2024-01-01", "y": 3}], "aggregation": "monthly"},
        )
        assert resp.status_code == 400

    def test_returns_200_for_valid_monthly_series(self, flask_client):
        series = [
            {"ds": f"2023-{m:02d}-01", "y": m % 5 + 1}
            for m in range(1, 13)
        ]
        resp = flask_client.post(
            "/api/ml/predict-series",
            json={"series": series, "aggregation": "monthly", "periods": 3},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "predictions" in data
        assert len(data["predictions"]) == 3
