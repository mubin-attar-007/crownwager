"""Fetch sports news from free RSS feeds:  python manage.py fetch_news"""
from __future__ import annotations

from django.core.management.base import BaseCommand

from content.services import fetch_and_store_news


class Command(BaseCommand):
    help = "Fetch sports news from free public RSS feeds (ESPN) into the Article model."

    def handle(self, *args, **options) -> None:
        result = fetch_and_store_news()
        self.stdout.write(self.style.SUCCESS(f"News refreshed: {result}"))
