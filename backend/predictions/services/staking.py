"""Expected-value and Kelly-criterion staking math.

Ported from the legacy ``nba_betting/src/Utils/{Expected_Value,Kelly_Criterion}.py`` and the heart
of the dimers-style "best bets" feature: given a model's win probability and a sportsbook's odds,
quantify the edge (EV) and the optimal stake (Kelly). All math uses ``Decimal``.
"""
from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from typing import Any

CENT = Decimal("0.01")


def _d(value: Any) -> Decimal:
    return Decimal(str(value))


def american_to_decimal(american: Any) -> Decimal:
    """Convert American odds (e.g. +150, -110) to decimal odds (e.g. 2.50, 1.91)."""
    a = _d(american)
    if a >= 100:
        return (a / Decimal("100")) + Decimal("1")
    return (Decimal("100") / a.copy_abs()) + Decimal("1")


def decimal_to_implied_prob(decimal_odds: Any) -> Decimal:
    return Decimal("1") / _d(decimal_odds)


def expected_value(win_prob: Any, american_odds: Any, stake: Any = 100) -> Decimal:
    """Expected profit on a `stake` wager. EV = p*profit - (1-p)*stake."""
    p = _d(win_prob)
    dec = american_to_decimal(american_odds)
    s = _d(stake)
    profit_if_win = s * (dec - Decimal("1"))
    ev = p * profit_if_win - (Decimal("1") - p) * s
    return ev.quantize(CENT, rounding=ROUND_HALF_UP)


def edge(win_prob: Any, american_odds: Any) -> Decimal:
    """Model edge = model probability − market implied probability (as a percentage)."""
    p = _d(win_prob)
    implied = decimal_to_implied_prob(american_to_decimal(american_odds))
    return ((p - implied) * Decimal("100")).quantize(CENT, rounding=ROUND_HALF_UP)


def kelly_fraction(win_prob: Any, american_odds: Any, fraction: Any = 1) -> Decimal:
    """Fraction of bankroll to wager under (fractional) Kelly. Clamped at 0 (never bet a -EV edge)."""
    p = _d(win_prob)
    dec = american_to_decimal(american_odds)
    b = dec - Decimal("1")  # net decimal odds
    if b <= 0:
        return Decimal("0")
    full_kelly = (b * p - (Decimal("1") - p)) / b
    sized = full_kelly * _d(fraction)
    return sized.quantize(Decimal("0.0001")) if sized > 0 else Decimal("0")


def recommended_stake(win_prob: Any, american_odds: Any, bankroll: Any, fraction: Any = 0.5) -> Decimal:
    """Concrete stake = bankroll × fractional-Kelly fraction."""
    k = kelly_fraction(win_prob, american_odds, fraction)
    return (_d(bankroll) * k).quantize(CENT, rounding=ROUND_HALF_UP)


def bet_profit(status: str, american_odds: Any, stake: Any) -> Decimal:
    """Realized profit/loss for a settled bet (0 for pending/push)."""
    s = _d(stake)
    if status == "won":
        return ((american_to_decimal(american_odds) - Decimal("1")) * s).quantize(CENT, ROUND_HALF_UP)
    if status == "lost":
        return (-s).quantize(CENT, ROUND_HALF_UP)
    return Decimal("0.00")
