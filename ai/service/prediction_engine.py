"""Prediction engine: turns game inputs into win probabilities and per-market picks.

Produces moneyline (home/away) and over/under probabilities, emitting exactly one pick per market
(``model_name="ensemble"`` — the canonical key the backend's best-bets ranking consumes). The
probability is the validated XGBoost model's output when it and both teams are available, and a
transparent logistic baseline otherwise. No fabricated multi-model split: one model, one number.
"""
from __future__ import annotations

import math

from .feature_engineer import build_features, home_win_logit
from .model_registry import ModelInfo, active_model, load_ml_assets
from .schemas import GameIn, GamePrediction, ModelPick

DISCLAIMER = "Informational only. Not financial advice. 18+. Please bet responsibly."


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def _clamp(p: float, lo: float = 0.02, hi: float = 0.98) -> float:
    return max(lo, min(hi, p))


def _model_prob_home(game: GameIn) -> float | None:
    """Real XGBoost probability for the home team, if the model + both teams are available."""
    assets = load_ml_assets()
    if not assets:
        return None
    tf = assets["team_features"]
    home, away = tf.get(game.home_team), tf.get(game.away_team)
    if home is None or away is None:
        return None
    import numpy as np

    cols = assets["feature_columns"]
    vec = [(away.get(c[:-2], 0.0) if c.endswith(".1") else home.get(c, 0.0)) for c in cols]
    p = float(assets["model"].predict_proba(np.array([vec], dtype=float))[0, 1])
    return _clamp(p)


def _moneyline_prob_home(game: GameIn) -> float:
    # Prefer the validated XGBoost model; fall back to the transparent baseline.
    p = _model_prob_home(game)
    if p is not None:
        return p
    feats = build_features(
        game.home_rating, game.away_rating, game.home_rest_days, game.away_rest_days
    )
    return _clamp(_sigmoid(home_win_logit(feats)))


def _total_over_prob(game: GameIn) -> float:
    # Without live pace/efficiency data, totals are near coin-flips; nudge slightly by rating sum.
    base = 0.5
    if game.home_rating is not None and game.away_rating is not None:
        base += 0.002 * ((game.home_rating + game.away_rating) - 0.0)
    return _clamp(base, 0.35, 0.65)


def _pick_for_selection(market: str, selection: str, game: GameIn, p_home: float, p_over: float) -> float:
    """Probability the given offered selection wins, so it matches the odds for best-bets."""
    if market == "moneyline":
        if selection == game.home_team:
            return p_home
        if selection == game.away_team:
            return 1.0 - p_home
        return p_home  # default to home if selection unrecognized
    if market == "total":
        return p_over if selection.lower().startswith("over") else 1.0 - p_over
    return 0.5


def predict_game(game: GameIn, model: ModelInfo) -> GamePrediction:
    p_home = _moneyline_prob_home(game)
    p_over = _total_over_prob(game)

    models: list[ModelPick] = []
    for market, offer in game.market_odds.items():
        prob = round(_pick_for_selection(market, offer.selection, game, p_home, p_over), 4)
        # Ensemble (authoritative, used by best-bets ranking).
        models.append(
            ModelPick(
                model_name="ensemble",
                market=market,
                pick=offer.selection,
                win_probability=prob,
                confidence=round(abs(prob - 0.5) * 2, 4),
            )
        )

    # If no markets were requested, still expose the moneyline view for the home team.
    if not game.market_odds:
        models.append(
            ModelPick(
                model_name="ensemble", market="moneyline", pick=game.home_team,
                win_probability=round(p_home, 4), confidence=round(abs(p_home - 0.5) * 2, 4),
            )
        )

    return GamePrediction(
        external_id=game.external_id,
        home_team=game.home_team,
        away_team=game.away_team,
        sport_key=game.sport_key,
        sport_title=game.sport_title,
        commence_time=game.commence_time,
        models=models,
        market_odds=game.market_odds,
    )


def predict_games(games: list[GameIn]) -> tuple[list[GamePrediction], ModelInfo]:
    model = active_model()
    return [predict_game(g, model) for g in games], model
