"""Tests for the CrownBot assistant (offline-fallback path; no API key)."""
from __future__ import annotations

import pytest
from rest_framework.test import APIClient


@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.mark.django_db
def test_chat_offline_fallback_summarizes_best_bets(client: APIClient) -> None:
    resp = client.post(
        "/api/assistant/chat/",
        {"message": "What are today's best bets?", "sport": "basketball_nba"},
        format="json",
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["powered_by"] == "offline-fallback"
    assert "best bets" in body["reply"].lower()
    assert "disclaimer" in body


@pytest.mark.django_db
def test_chat_requires_message(client: APIClient) -> None:
    resp = client.post("/api/assistant/chat/", {"sport": "basketball_nba"}, format="json")
    assert resp.status_code == 400
