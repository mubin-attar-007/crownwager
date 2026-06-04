"""Allowlist of supported sports. Validating the `sport` query param here prevents invalid values
(and any path-injection) from reaching The Odds API URL."""
from __future__ import annotations

DEFAULT_SPORT = "basketball_nba"

ALLOWED_SPORTS = {
    "basketball_nba",
    "americanfootball_nfl",
    "baseball_mlb",
    "icehockey_nhl",
}


def clean_sport(value: str | None) -> str:
    """Return the value if it's a supported sport key, else the default."""
    return value if value in ALLOWED_SPORTS else DEFAULT_SPORT
