"""Prediction pipeline: odds → AI probabilities → ranked best bets.

Single source of truth shared by the API views, the Celery task, and the management command.
Degrades gracefully: live odds + AI when configured/reachable; otherwise demo data — always returning
something so the product runs.
"""
from __future__ import annotations

import logging

from odds.services.odds_api import OddsAPIClient, OddsAPIError

from ..fixtures_demo import DEMO_PREDICTIONS
from .ai_client import AIServiceClient, AIServiceError
from .best_bets import compute_best_bets

logger = logging.getLogger(__name__)


def games_from_odds(events: list[dict]) -> list[dict]:
    """Build AI game inputs from live odds events, offering the home team's best moneyline price."""
    games: list[dict] = []
    for ev in events:
        home = ev.get("home_team")
        away = ev.get("away_team")
        if not home or not away:
            continue
        best_price: int | None = None
        best_book = ""
        for bk in ev.get("bookmakers", []):
            for market in bk.get("markets", []):
                if market.get("key") != "h2h":
                    continue
                for outcome in market.get("outcomes", []):
                    if outcome.get("name") == home and outcome.get("price") is not None:
                        price = int(outcome["price"])  # american when odds_format='american'
                        if best_price is None or price > best_price:
                            best_price, best_book = price, bk.get("title", "")
        if best_price is None:
            continue
        games.append(
            {
                "external_id": ev.get("id", ""),
                "home_team": home,
                "away_team": away,
                "sport_key": ev.get("sport_key", ""),
                "sport_title": ev.get("sport_title", ""),
                "commence_time": ev.get("commence_time"),
                "market_odds": {
                    "moneyline": {"selection": home, "bookmaker": best_book, "american": best_price}
                },
            }
        )
    return games


def _ai_predict(games: list[dict]) -> list[dict] | None:
    try:
        client = AIServiceClient()
        if client.health():
            preds = client.predict(games)
            return preds or None
    except AIServiceError:
        return None
    return None


def gather_predictions(sport: str) -> tuple[list[dict], str]:
    """Return (prediction_dicts, source). source ∈ {"live", "demo"}."""
    # Live path: real odds (american format) + AI probabilities.
    try:
        events = OddsAPIClient().fetch_odds(sport=sport, markets="h2h", odds_format="american")
        live_games = games_from_odds(events)
        if live_games:
            preds = _ai_predict(live_games)
            if preds:
                return preds, "live"
    except OddsAPIError:
        pass

    # Demo path: still exercises the AI service when it's up, else static demo predictions.
    demo_games = [g for g in DEMO_PREDICTIONS if g["sport_key"] == sport] or DEMO_PREDICTIONS
    preds = _ai_predict(demo_games)
    return (preds or demo_games), "demo"


def gather_best_bets(sport: str, min_edge: str | float = 0) -> tuple[list[dict], str]:
    from decimal import Decimal

    preds, source = gather_predictions(sport)
    bets = compute_best_bets(preds, min_edge=Decimal(str(min_edge)))
    return bets, source
