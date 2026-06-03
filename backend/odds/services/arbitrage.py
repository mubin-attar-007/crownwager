"""Arbitrage detection over The-Odds-API h2h markets.

Ported from the legacy ``betting_bot/main.py`` Event class, with the key correctness fix the
assessment flagged: **all money/odds math uses ``Decimal``** instead of float, and the algorithm
is pure (no Django, no network, no ``print``) so it is fully unit-testable.

Arbitrage exists when the sum of inverse best-odds across mutually-exclusive outcomes is < 1:
    implied_total = Σ (1 / best_decimal_odds_i)  < 1   →   guaranteed profit
Stakes are allocated proportionally to each outcome's inverse odds so every outcome returns
the same payout.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

TWO_PLACES = Decimal("0.01")


def _d(value: Any) -> Decimal:
    """Coerce arbitrary numeric input to Decimal safely (via str to avoid float artifacts)."""
    return Decimal(str(value))


def _money(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


@dataclass
class OutcomeOdds:
    outcome: str
    bookmaker: str
    price: Decimal  # decimal odds, e.g. 2.10


@dataclass
class ArbitrageOpportunity:
    event_id: str
    sport_key: str
    sport_title: str
    home_team: str
    away_team: str
    commence_time: str | None
    bet_size: Decimal
    legs: list[dict] = field(default_factory=list)
    implied_total: Decimal = Decimal("0")
    profit: Decimal = Decimal("0")
    profit_pct: Decimal = Decimal("0")

    def as_dict(self) -> dict:
        return {
            "event_id": self.event_id,
            "sport_key": self.sport_key,
            "sport_title": self.sport_title,
            "home_team": self.home_team,
            "away_team": self.away_team,
            "commence_time": self.commence_time,
            "bet_size": str(_money(self.bet_size)),
            "implied_total": str(self.implied_total.quantize(Decimal("0.0001"))),
            "profit": str(_money(self.profit)),
            "profit_pct": str(self.profit_pct.quantize(Decimal("0.01"))),
            "legs": self.legs,
        }


def best_odds_per_outcome(event: dict) -> dict[str, OutcomeOdds]:
    """Return the best (highest) decimal price for each h2h outcome across all bookmakers."""
    best: dict[str, OutcomeOdds] = {}
    for bookmaker in event.get("bookmakers", []):
        title = bookmaker.get("title") or bookmaker.get("key", "Unknown")
        for market in bookmaker.get("markets", []):
            if market.get("key") != "h2h":
                continue
            for outcome in market.get("outcomes", []):
                name = outcome.get("name")
                price_raw = outcome.get("price")
                if name is None or price_raw is None:
                    continue
                price = _d(price_raw)
                if price <= 0:
                    continue
                current = best.get(name)
                if current is None or price > current.price:
                    best[name] = OutcomeOdds(outcome=name, bookmaker=title, price=price)
    return best


def evaluate_event(event: dict, bet_size: Decimal) -> ArbitrageOpportunity | None:
    """Return an ArbitrageOpportunity if the event is arbitrageable, else None."""
    best = best_odds_per_outcome(event)
    if len(best) < 2:
        return None

    implied_total = sum((Decimal("1") / o.price for o in best.values()), Decimal("0"))
    if implied_total >= 1:
        return None

    payout = bet_size / implied_total
    profit = payout - bet_size

    legs: list[dict] = []
    for o in best.values():
        stake = (bet_size * (Decimal("1") / o.price)) / implied_total
        legs.append(
            {
                "outcome": o.outcome,
                "bookmaker": o.bookmaker,
                "price": str(o.price),
                "stake": str(_money(stake)),
                "implied_prob": str((Decimal("1") / o.price).quantize(Decimal("0.0001"))),
            }
        )

    return ArbitrageOpportunity(
        event_id=event.get("id", ""),
        sport_key=event.get("sport_key", ""),
        sport_title=event.get("sport_title", ""),
        home_team=event.get("home_team", ""),
        away_team=event.get("away_team", ""),
        commence_time=event.get("commence_time"),
        bet_size=bet_size,
        legs=legs,
        implied_total=implied_total,
        profit=profit,
        profit_pct=(payout / bet_size - Decimal("1")) * Decimal("100"),
    )


def find_arbitrage(events: list[dict], bet_size: Decimal | float | str = 100) -> list[dict]:
    """Scan a list of The-Odds-API events and return arbitrage opportunities as plain dicts,
    sorted by descending profit percentage."""
    size = _d(bet_size)
    opportunities = [evaluate_event(ev, size) for ev in events]
    found = [o.as_dict() for o in opportunities if o is not None]
    found.sort(key=lambda d: Decimal(d["profit_pct"]), reverse=True)
    return found
