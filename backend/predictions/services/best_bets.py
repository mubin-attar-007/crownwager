"""Turn model predictions + market odds into ranked +EV "best bets" (the dimers-style core loop)."""
from __future__ import annotations

from decimal import Decimal

from .staking import (
    american_to_decimal,
    edge,
    expected_value,
    kelly_fraction,
)


def _best_model_prob(models: list[dict], market: str, selection: str) -> tuple[Decimal, Decimal] | None:
    """Prefer the ensemble model's probability for the given market/selection; else any match."""
    candidates = [
        m for m in models
        if m.get("market") == market and m.get("pick") == selection
    ]
    if not candidates:
        return None
    candidates.sort(key=lambda m: 0 if m.get("model_name") == "ensemble" else 1)
    chosen = candidates[0]
    return Decimal(str(chosen["win_probability"])), Decimal(str(chosen.get("confidence", 0)))


def compute_best_bets(predictions: list[dict], min_edge: Decimal = Decimal("0")) -> list[dict]:
    """For each game/market, compare the model's probability to the offered odds and compute the edge.

    ``predictions`` items follow the AI-service / demo shape: each has ``models`` (list of model picks)
    and ``market_odds`` (offered price per market). Returns published-ready best-bet dicts sorted by
    descending edge, filtered to ``edge >= min_edge``.
    """
    bets: list[dict] = []
    for game in predictions:
        market_odds: dict = game.get("market_odds", {})
        models: list[dict] = game.get("models", [])
        for market, offer in market_odds.items():
            selection = offer["selection"]
            american = offer["american"]
            prob = _best_model_prob(models, market, selection)
            if prob is None:
                continue
            win_prob, confidence = prob
            e = edge(win_prob, american)
            if e < min_edge:
                continue
            dec = american_to_decimal(american)
            bets.append(
                {
                    "external_id": game["external_id"],
                    "home_team": game["home_team"],
                    "away_team": game["away_team"],
                    "sport_key": game.get("sport_key", ""),
                    "sport_title": game.get("sport_title", ""),
                    "commence_time": game.get("commence_time"),
                    "market": market,
                    "selection": selection,
                    "bookmaker": offer.get("bookmaker", ""),
                    "american_odds": int(american),
                    "decimal_odds": str(dec.quantize(Decimal("0.001"))),
                    "model_probability": str(win_prob),
                    "edge_pct": str(e),
                    "expected_value": str(expected_value(win_prob, american, 100)),
                    "kelly_fraction": str(kelly_fraction(win_prob, american, fraction=Decimal("0.5"))),
                    "confidence": str(confidence),
                }
            )
    bets.sort(key=lambda b: Decimal(b["edge_pct"]), reverse=True)
    return bets
