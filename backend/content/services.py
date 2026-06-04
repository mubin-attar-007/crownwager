"""Ingest real sports news from free public RSS feeds (ESPN) into the Article model.

No API key, no cost — just public RSS. Idempotent: dedupes on source_url.
"""
from __future__ import annotations

import logging
from datetime import UTC, datetime

from django.utils.html import escape, strip_tags
from django.utils.text import slugify

from .models import Article

logger = logging.getLogger(__name__)

# Free public ESPN RSS feeds (no key required).
FEEDS = {
    "NBA": "https://www.espn.com/espn/rss/nba/news",
    "NFL": "https://www.espn.com/espn/rss/nfl/news",
    "MLB": "https://www.espn.com/espn/rss/mlb/news",
    "NHL": "https://www.espn.com/espn/rss/nhl/news",
}
MAX_PER_FEED = 8


def _parse_date(entry) -> datetime:
    val = getattr(entry, "published_parsed", None) or getattr(entry, "updated_parsed", None)
    if val:
        try:
            return datetime(val[0], val[1], val[2], val[3], val[4], val[5], tzinfo=UTC)
        except Exception:
            pass
    return datetime.now(UTC)


def fetch_and_store_news() -> dict:
    """Pull recent items from each feed and upsert them as published News articles."""
    import feedparser

    created = 0
    seen = 0
    for league, url in FEEDS.items():
        try:
            parsed = feedparser.parse(url)
        except Exception as exc:  # pragma: no cover - network
            logger.warning("Feed failed for %s: %s", league, exc)
            continue
        for entry in parsed.entries[:MAX_PER_FEED]:
            seen += 1
            link = getattr(entry, "link", "") or ""
            title = (getattr(entry, "title", "") or "").strip()
            if not title or not link:
                continue
            # Sanitize untrusted RSS content: strip tags for the summary, escape for the body embed.
            summary = strip_tags((getattr(entry, "summary", "") or "").strip())[:400]
            safe_title = strip_tags(title)[:200]
            published = _parse_date(entry)
            slug = f"{league.lower()}-{slugify(safe_title)[:200]}"
            _, was_created = Article.objects.update_or_create(
                source_url=link,
                defaults={
                    "title": f"[{league}] {safe_title}",
                    "slug": slug,
                    "category": Article.Category.NEWS,
                    "summary": summary,
                    "body": f"<p>{escape(summary)}</p><p><a href=\"{escape(link)}\" target=\"_blank\" "
                    f'rel="noopener noreferrer">Read the full story at ESPN →</a></p>',
                    "source": "ESPN",
                    "is_published": True,
                    "published_at": published,
                },
            )
            created += int(was_created)
    result = {"feeds": len(FEEDS), "seen": seen, "created_or_updated": created}
    logger.info("fetch_and_store_news: %s", result)
    return result
