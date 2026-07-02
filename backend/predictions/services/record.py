"""Compute the model's realized track record from settled BestBets.

Win rate by edge tier, units P&L (flat 1 unit/pick), ROI, and sample size — all from real graded
outcomes. When nothing has settled yet, every metric is zero and ``insufficient`` is True: the
honest "collecting" state, never a fabricated record.
"""
from __future__ import annotations

from decimal import Decimal

from ..models import BestBet
from .staking import bet_profit

CENT = Decimal("0.01")

# Edge buckets in percentage points; upper bound exclusive, last tier open-ended.
EDGE_TIERS: list[tuple[str, Decimal, Decimal | None]] = [
    ("0–2%", Decimal("0"), Decimal("2")),
    ("2–5%", Decimal("2"), Decimal("5")),
    ("5–10%", Decimal("5"), Decimal("10")),
    ("10%+", Decimal("10"), None),
]

# Below this many settled picks, the sample is too small to be meaningful (flagged, not hidden).
MIN_SAMPLE = 20

SETTLED = ("won", "lost", "push")


def _summarize(bets: list[BestBet]) -> dict:
    wins = sum(1 for b in bets if b.result == "won")
    losses = sum(1 for b in bets if b.result == "lost")
    pushes = sum(1 for b in bets if b.result == "push")
    decided = wins + losses
    win_rate = (Decimal(wins) / Decimal(decided) * 100) if decided else Decimal("0")
    # Flat 1-unit stake per pick: won → +(decimal-1), lost → -1, push → 0. Pushes refund the stake.
    units_profit = sum((bet_profit(b.result, b.american_odds, 1) for b in bets), Decimal("0"))
    units_staked = Decimal(decided)
    roi = (units_profit / units_staked * 100) if units_staked else Decimal("0")
    return {
        "n": len(bets),
        "wins": wins,
        "losses": losses,
        "pushes": pushes,
        "record": f"{wins}-{losses}-{pushes}",
        "win_rate_pct": str(win_rate.quantize(CENT)),
        "units_profit": str(units_profit.quantize(CENT)),
        "units_staked": str(units_staked.quantize(CENT)),
        "roi_pct": str(roi.quantize(CENT)),
    }


def compute_model_record(sport: str | None = None) -> dict:
    qs = BestBet.objects.filter(is_published=True, result__in=SETTLED).select_related("game")
    if sport:
        qs = qs.filter(game__sport_key=sport)
    settled = list(qs)

    tiers = []
    for label, lo, hi in EDGE_TIERS:
        in_tier = [b for b in settled if b.edge_pct >= lo and (hi is None or b.edge_pct < hi)]
        summary = _summarize(in_tier)
        summary["label"] = label
        tiers.append(summary)

    pending = BestBet.objects.filter(is_published=True, result="pending")
    if sport:
        pending = pending.filter(game__sport_key=sport)

    last = max((b.settled_at for b in settled if b.settled_at), default=None)
    return {
        "sport": sport,
        "settled_count": len(settled),
        "pending_count": pending.count(),
        "insufficient": len(settled) < MIN_SAMPLE,
        "min_sample": MIN_SAMPLE,
        "overall": _summarize(settled),
        "by_edge_tier": tiers,
        "last_settled_at": last.isoformat() if last else None,
        "disclaimer": (
            "Realized results from settled model picks graded against final scores. "
            "Past performance does not guarantee future results. Informational only. 18+."
        ),
    }
