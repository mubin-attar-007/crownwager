"""Grade published BestBets against final game scores — the basis of an honest, verifiable model
track record.

A pick is graded only when its game is FINAL with both scores present. Anything that can't be
mapped to the real result (unknown selection, a total with no parseable line) grades ``void`` and
is excluded from the record rather than guessed. Outcomes are never fabricated or backfilled.
"""
from __future__ import annotations

import re
from decimal import Decimal

from ..models import BestBet, Game

_NUM = re.compile(r"[-+]?\d+(?:\.\d+)?")


def parse_total_line(selection: str) -> Decimal | None:
    """Extract the total line from an over/under selection (e.g. 'Over 220.5' → Decimal('220.5'))."""
    match = _NUM.search(selection or "")
    return Decimal(match.group()) if match else None


def grade_bestbet(bb: BestBet) -> str | None:
    """Return ``won`` / ``lost`` / ``push`` / ``void`` for a pick, or ``None`` if its game isn't final.

    - moneyline: the selected team must outscore its opponent.
    - total: the game total (home + away) vs the line embedded in the selection ('Over/Under N').
    """
    g: Game = bb.game
    if g.status != Game.Status.FINAL or g.home_score is None or g.away_score is None:
        return None

    if bb.market == "moneyline":
        if bb.selection == g.home_team:
            mine, theirs = g.home_score, g.away_score
        elif bb.selection == g.away_team:
            mine, theirs = g.away_score, g.home_score
        else:
            return BestBet.Result.VOID
        if mine == theirs:
            return BestBet.Result.PUSH
        return BestBet.Result.WON if mine > theirs else BestBet.Result.LOST

    if bb.market == "total":
        line = parse_total_line(bb.selection)
        if line is None:
            return BestBet.Result.VOID
        total = Decimal(g.home_score + g.away_score)
        if total == line:
            return BestBet.Result.PUSH
        is_over = bb.selection.strip().lower().startswith("over")
        if is_over:
            return BestBet.Result.WON if total > line else BestBet.Result.LOST
        return BestBet.Result.WON if total < line else BestBet.Result.LOST

    return BestBet.Result.VOID
