"""Run the prediction refresh synchronously (handy for seeding + local demo).

    python manage.py refresh_predictions --sport basketball_nba
"""
from __future__ import annotations

from django.core.management.base import BaseCommand

from predictions.tasks import refresh_predictions


class Command(BaseCommand):
    help = "Fetch odds + AI predictions and persist Games/Predictions/BestBets."

    def add_arguments(self, parser) -> None:
        parser.add_argument("--sport", default="basketball_nba")

    def handle(self, *args, **options) -> None:
        result = refresh_predictions(options["sport"])
        self.stdout.write(self.style.SUCCESS(f"Refreshed: {result}"))
