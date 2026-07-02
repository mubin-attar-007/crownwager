"""Grade published BestBets whose games are final, from the real score.

Idempotent — only touches picks still ``pending``. Run on deploy and/or on a schedule (e.g. a
GitHub Actions cron) after scores refresh:

    python manage.py settle_bestbets [--sport basketball_nba]
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.utils import timezone

from predictions.models import BestBet
from predictions.services.grading import grade_bestbet


class Command(BaseCommand):
    help = "Grade published BestBets against final game scores (idempotent)."

    def add_arguments(self, parser) -> None:
        parser.add_argument("--sport", default=None, help="Limit to one sport_key.")

    def handle(self, *args, **options) -> None:
        qs = BestBet.objects.filter(
            is_published=True, result=BestBet.Result.PENDING
        ).select_related("game")
        if options.get("sport"):
            qs = qs.filter(game__sport_key=options["sport"])

        graded = {"won": 0, "lost": 0, "push": 0, "void": 0}
        now = timezone.now()
        for bb in qs:
            outcome = grade_bestbet(bb)
            if outcome is None:
                continue  # game not final yet — leave pending
            bb.result = outcome
            bb.settled_at = now
            bb.save(update_fields=["result", "settled_at"])
            graded[outcome] += 1

        total = sum(graded.values())
        self.stdout.write(
            self.style.SUCCESS(
                f"Settled {total} pick(s): {graded['won']} won, {graded['lost']} lost, "
                f"{graded['push']} push, {graded['void']} void."
            )
        )
