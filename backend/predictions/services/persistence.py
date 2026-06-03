"""Persist prediction-pipeline output into the normalized schema (Game/ModelPrediction/BestBet)."""
from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from ..models import BestBet, Game, ModelPrediction


def _parse_dt(value: str | None):
    if not value:
        return timezone.now()
    dt = parse_datetime(value)
    return dt or timezone.now()


@transaction.atomic
def persist_predictions(prediction_dicts: list[dict]) -> dict[str, Game]:
    """Upsert Game + ModelPrediction rows. Returns a map of external_id → Game."""
    games: dict[str, Game] = {}
    for g in prediction_dicts:
        ext = g.get("external_id")
        if not ext:
            continue
        game, _ = Game.objects.update_or_create(
            external_id=ext,
            defaults={
                "sport_key": g.get("sport_key", "basketball_nba"),
                "sport_title": g.get("sport_title", ""),
                "home_team": g.get("home_team", ""),
                "away_team": g.get("away_team", ""),
                "commence_time": _parse_dt(g.get("commence_time")),
            },
        )
        games[ext] = game
        for m in g.get("models", []):
            ModelPrediction.objects.update_or_create(
                game=game,
                model_name=m["model_name"],
                market=m["market"],
                defaults={
                    "pick": m["pick"],
                    "win_probability": Decimal(str(m["win_probability"])),
                    "confidence": Decimal(str(m.get("confidence", 0))),
                },
            )
    return games


@transaction.atomic
def persist_best_bets(best_bet_dicts: list[dict], games: dict[str, Game]) -> int:
    """Replace the published best-bets set with a fresh ranked list."""
    BestBet.objects.filter(is_published=True).delete()
    created = 0
    for b in best_bet_dicts:
        game = games.get(b["external_id"])
        if game is None:
            continue
        BestBet.objects.create(
            game=game,
            market=b["market"],
            selection=b["selection"],
            bookmaker=b.get("bookmaker", ""),
            american_odds=int(b["american_odds"]),
            decimal_odds=Decimal(str(b["decimal_odds"])),
            model_probability=Decimal(str(b["model_probability"])),
            edge_pct=Decimal(str(b["edge_pct"])),
            expected_value=Decimal(str(b["expected_value"])),
            kelly_fraction=Decimal(str(b["kelly_fraction"])),
            confidence=Decimal(str(b.get("confidence", 0))),
            is_published=True,
        )
        created += 1
    return created
