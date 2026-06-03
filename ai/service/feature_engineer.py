"""Feature engineering for game predictions.

Carries forward the legacy idea (team strength + days-of-rest differential drive win probability),
but in a clean, testable form. When rich inputs (ratings, rest) aren't supplied, sensible NBA priors
apply so the service always returns a result.
"""
from __future__ import annotations

from dataclasses import dataclass

# Empirical NBA home-court edge expressed as a logit bump (~ home teams win ~58–60%).
HOME_COURT_LOGIT = 0.33
# Each extra day of rest relative to the opponent is a small edge.
REST_LOGIT_PER_DAY = 0.05
# Rating points are on a per-100-possessions net-rating-ish scale.
RATING_LOGIT_PER_POINT = 0.06


@dataclass
class GameFeatures:
    home_court: float
    rating_diff: float  # home minus away
    rest_diff: int  # home minus away
    has_ratings: bool


def build_features(
    home_rating: float | None,
    away_rating: float | None,
    home_rest_days: int | None,
    away_rest_days: int | None,
) -> GameFeatures:
    has_ratings = home_rating is not None and away_rating is not None
    rating_diff = (home_rating - away_rating) if has_ratings else 0.0
    rest_diff = (home_rest_days or 0) - (away_rest_days or 0)
    return GameFeatures(
        home_court=HOME_COURT_LOGIT,
        rating_diff=rating_diff,
        rest_diff=rest_diff,
        has_ratings=has_ratings,
    )


def home_win_logit(features: GameFeatures) -> float:
    return (
        features.home_court
        + RATING_LOGIT_PER_POINT * features.rating_diff
        + REST_LOGIT_PER_DAY * features.rest_diff
    )
