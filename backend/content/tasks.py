"""Celery task to refresh sports news from free RSS feeds."""
from __future__ import annotations

from celery import shared_task

from .services import fetch_and_store_news


@shared_task
def refresh_news() -> dict:
    return fetch_and_store_news()
