"""Demo odds data so the API (and frontend) work end-to-end without a live Odds API key.

Endpoints fall back to this clearly-labelled sample when ``ODDS_API_KEY`` is unset or the upstream
call fails, so the demo always runs. The first event is deliberately arbitrageable.
"""
from __future__ import annotations

# A deliberately arbitrageable matchup: 1/2.10 + 1/2.10 = 0.952 < 1  → ~5% edge.
DEMO_ODDS: list[dict] = [
    {
        "id": "demo-arb-001",
        "sport_key": "basketball_nba",
        "sport_title": "NBA",
        "commence_time": "2026-06-04T23:30:00Z",
        "home_team": "Los Angeles Lakers",
        "away_team": "Boston Celtics",
        "bookmakers": [
            {
                "key": "draftkings",
                "title": "DraftKings",
                "markets": [
                    {
                        "key": "h2h",
                        "outcomes": [
                            {"name": "Los Angeles Lakers", "price": 2.10},
                            {"name": "Boston Celtics", "price": 1.74},
                        ],
                    }
                ],
            },
            {
                "key": "fanduel",
                "title": "FanDuel",
                "markets": [
                    {
                        "key": "h2h",
                        "outcomes": [
                            {"name": "Los Angeles Lakers", "price": 1.80},
                            {"name": "Boston Celtics", "price": 2.10},
                        ],
                    }
                ],
            },
        ],
    },
    {
        "id": "demo-002",
        "sport_key": "basketball_nba",
        "sport_title": "NBA",
        "commence_time": "2026-06-05T00:00:00Z",
        "home_team": "Golden State Warriors",
        "away_team": "Denver Nuggets",
        "bookmakers": [
            {
                "key": "betmgm",
                "title": "BetMGM",
                "markets": [
                    {
                        "key": "h2h",
                        "outcomes": [
                            {"name": "Golden State Warriors", "price": 1.91},
                            {"name": "Denver Nuggets", "price": 1.95},
                        ],
                    }
                ],
            }
        ],
    },
]

DEMO_SCORES: list[dict] = [
    {
        "id": "demo-score-001",
        "sport_key": "basketball_nba",
        "sport_title": "NBA",
        "commence_time": "2026-06-02T23:30:00Z",
        "completed": True,
        "home_team": "Los Angeles Lakers",
        "away_team": "Boston Celtics",
        "scores": [
            {"name": "Los Angeles Lakers", "score": "112"},
            {"name": "Boston Celtics", "score": "108"},
        ],
    }
]
