"""Tests for the AI prediction service: feature engineering, engine, and the HTTP endpoints."""
from __future__ import annotations

from fastapi.testclient import TestClient

from ai.service.app import app
from ai.service.feature_engineer import build_features, home_win_logit
from ai.service.prediction_engine import predict_games
from ai.service.schemas import GameIn, MarketOdds

client = TestClient(app)


def test_home_court_gives_home_edge() -> None:
    feats = build_features(None, None, None, None)
    # With no other info, home logit is positive → > 50% for the home team.
    assert home_win_logit(feats) > 0


def test_rating_and_rest_increase_home_prob() -> None:
    strong = build_features(home_rating=5.0, away_rating=-5.0, home_rest_days=3, away_rest_days=0)
    weak = build_features(home_rating=-5.0, away_rating=5.0, home_rest_days=0, away_rest_days=3)
    assert home_win_logit(strong) > home_win_logit(weak)


def test_predict_matches_offered_selection() -> None:
    game = GameIn(
        external_id="g1",
        home_team="Lakers",
        away_team="Celtics",
        market_odds={"moneyline": MarketOdds(selection="Lakers", bookmaker="DK", american=110)},
    )
    preds, model = predict_games([game])
    ensemble = [m for m in preds[0].models if m.model_name == "ensemble"]
    assert ensemble and ensemble[0].pick == "Lakers"
    assert 0 < ensemble[0].win_probability < 1


def test_health_endpoint() -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["service"] == "oddsaway-ai"


def test_predict_endpoint() -> None:
    payload = {
        "games": [
            {
                "external_id": "g1",
                "home_team": "Lakers",
                "away_team": "Celtics",
                "market_odds": {
                    "moneyline": {"selection": "Lakers", "bookmaker": "DK", "american": 110}
                },
            }
        ]
    }
    resp = client.post("/predict", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["predictions"][0]["external_id"] == "g1"
    assert "disclaimer" in body
