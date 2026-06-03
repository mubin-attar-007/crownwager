"""Celery tasks for refreshing predictions. Scheduled via Celery Beat (see settings)."""
from __future__ import annotations

import logging

from celery import shared_task

from .services.best_bets import compute_best_bets
from .services.persistence import persist_best_bets, persist_predictions
from .services.pipeline import gather_predictions

logger = logging.getLogger(__name__)

SPORTS = ["basketball_nba"]


@shared_task
def refresh_predictions(sport: str = "basketball_nba") -> dict:
    """Fetch odds → AI probabilities → persist Games/Predictions/BestBets for one sport."""
    preds, source = gather_predictions(sport)
    games = persist_predictions(preds)
    bets = compute_best_bets(preds)
    n_bets = persist_best_bets(bets, games)
    result = {"sport": sport, "source": source, "games": len(games), "best_bets": n_bets}
    logger.info("refresh_predictions: %s", result)
    return result


@shared_task
def refresh_all_predictions() -> list[dict]:
    """Beat entrypoint: refresh every tracked sport."""
    return [refresh_predictions(s) for s in SPORTS]
