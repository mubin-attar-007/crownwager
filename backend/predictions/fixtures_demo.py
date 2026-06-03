"""Demo predictions + best-bets so the Predictions/Best-Bets features work without the AI service."""
from __future__ import annotations

DEMO_PREDICTIONS: list[dict] = [
    {
        "external_id": "demo-arb-001",
        "sport_key": "basketball_nba",
        "sport_title": "NBA",
        "home_team": "Los Angeles Lakers",
        "away_team": "Boston Celtics",
        "commence_time": "2026-06-04T23:30:00Z",
        "models": [
            {"model_name": "xgboost", "market": "moneyline", "pick": "Los Angeles Lakers",
             "win_probability": 0.612, "confidence": 0.612},
            {"model_name": "nn", "market": "moneyline", "pick": "Los Angeles Lakers",
             "win_probability": 0.588, "confidence": 0.588},
            {"model_name": "ensemble", "market": "moneyline", "pick": "Los Angeles Lakers",
             "win_probability": 0.600, "confidence": 0.600},
            {"model_name": "ensemble", "market": "total", "pick": "Over 224.5",
             "win_probability": 0.560, "confidence": 0.560},
        ],
        "market_odds": {
            "moneyline": {"selection": "Los Angeles Lakers", "bookmaker": "DraftKings", "american": 110},
            "total": {"selection": "Over 224.5", "bookmaker": "FanDuel", "american": -105},
        },
    },
    {
        "external_id": "demo-002",
        "sport_key": "basketball_nba",
        "sport_title": "NBA",
        "home_team": "Golden State Warriors",
        "away_team": "Denver Nuggets",
        "commence_time": "2026-06-05T00:00:00Z",
        "models": [
            {"model_name": "ensemble", "market": "moneyline", "pick": "Denver Nuggets",
             "win_probability": 0.547, "confidence": 0.547},
        ],
        "market_odds": {
            "moneyline": {"selection": "Denver Nuggets", "bookmaker": "BetMGM", "american": 105},
        },
    },
]
