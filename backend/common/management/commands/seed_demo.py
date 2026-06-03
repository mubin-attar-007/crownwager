"""Seed demo data: an admin user, bookmakers, and a couple of articles.

Idempotent — safe to run repeatedly. Used to make the demo runnable out of the box:
    python manage.py seed_demo
"""
from __future__ import annotations

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from content.models import Article
from odds.models import Bookmaker

BOOKMAKERS = [
    ("draftkings", "DraftKings", "https://sportsbook.draftkings.com/"),
    ("fanduel", "FanDuel", "https://sportsbook.fanduel.com/"),
    ("betmgm", "BetMGM", "https://sports.betmgm.com/"),
    ("caesars", "Caesars", "https://www.caesars.com/sportsbook-and-casino"),
    ("bovada", "Bovada", "https://www.bovada.lv/sports"),
]

ARTICLES = [
    {
        "title": "What Is +EV Betting?",
        "category": Article.Category.GUIDE,
        "summary": "Expected value is the single most important concept in data-driven betting.",
        "body": "A bet has positive expected value (+EV) when your estimated probability of winning "
        "is higher than the probability implied by the sportsbook's odds. Over many bets, +EV "
        "wagering is what separates disciplined bettors from the crowd. Always bet responsibly. 18+.",
        "is_published": True,
    },
    {
        "title": "Understanding the Kelly Criterion",
        "category": Article.Category.GUIDE,
        "summary": "How much should you stake? Kelly sizes bets by your edge — fractional Kelly tames variance.",
        "body": "The Kelly criterion sizes each wager in proportion to your edge and the odds. Many "
        "bettors use 'fractional Kelly' (e.g. half-Kelly) to reduce variance. This platform is "
        "informational only and never handles real money.",
        "is_published": True,
    },
]


class Command(BaseCommand):
    help = "Seed demo data (admin user, bookmakers, articles)."

    def handle(self, *args, **options) -> None:
        if not User.objects.filter(username="admin@oddsaway.local").exists():
            User.objects.create_superuser(
                username="admin@oddsaway.local", email="admin@oddsaway.local", password="admin12345"
            )
            self.stdout.write(self.style.SUCCESS("Created admin user admin@oddsaway.local / admin12345"))

        for key, title, url in BOOKMAKERS:
            Bookmaker.objects.get_or_create(key=key, defaults={"title": title, "url": url})
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(BOOKMAKERS)} bookmakers."))

        for art in ARTICLES:
            Article.objects.get_or_create(title=art["title"], defaults=art)
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(ARTICLES)} articles."))
        self.stdout.write(self.style.SUCCESS("Demo seed complete."))
