"""Tests for staking math (EV/Kelly) and the best-bets endpoint."""
from __future__ import annotations

from decimal import Decimal

import pytest
import responses
from rest_framework.test import APIClient

from .services.staking import (
    american_to_decimal,
    edge,
    expected_value,
    kelly_fraction,
    recommended_stake,
)


# ── Staking math ──────────────────────────────────────────────────
def test_american_to_decimal() -> None:
    assert american_to_decimal(100) == Decimal("2")
    assert american_to_decimal(-110).quantize(Decimal("0.001")) == Decimal("1.909")
    assert american_to_decimal(150) == Decimal("2.5")


def test_expected_value_positive_edge() -> None:
    # 60% to win at +110 (decimal 2.10) on 100 stake → clearly +EV.
    ev = expected_value(0.60, 110, 100)
    assert ev > 0


def test_kelly_zero_when_no_edge() -> None:
    # Fair coin at even money → Kelly 0.
    assert kelly_fraction(0.50, 100) == Decimal("0")


def test_kelly_positive_with_edge() -> None:
    assert kelly_fraction(0.60, 100) > 0


def test_edge_is_prob_minus_implied() -> None:
    # +100 implies 50%. Model 60% → 10% edge.
    assert edge(0.60, 100) == Decimal("10.00")


def test_recommended_stake_scales_with_bankroll() -> None:
    s1 = recommended_stake(0.60, 100, 1000, Decimal("0.5"))
    s2 = recommended_stake(0.60, 100, 2000, Decimal("0.5"))
    assert s2 == s1 * 2


# ── Endpoint ──────────────────────────────────────────────────────
@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.mark.django_db
def test_best_bets_endpoint_demo(client: APIClient) -> None:
    resp = client.get("/api/best-bets/?sport=basketball_nba")
    assert resp.status_code == 200
    body = resp.json()
    assert body["demo"] is True
    assert body["count"] >= 1
    top = body["best_bets"][0]
    assert "edge_pct" in top and "recommended_stake" in top
    assert "disclaimer" in body


@pytest.mark.django_db
def test_predictions_endpoint_demo(client: APIClient) -> None:
    resp = client.get("/api/predictions/?sport=basketball_nba")
    assert resp.status_code == 200
    assert resp.json()["demo"] is True


# ── Persistence + DB-read path ────────────────────────────────────
@pytest.mark.django_db
def test_refresh_persists_games_and_bestbets() -> None:
    from predictions.models import BestBet, Game, ModelPrediction
    from predictions.tasks import refresh_predictions

    # Runs fully offline: no Odds key (OddsAPIError) and AI unreachable → demo data path.
    result = refresh_predictions("basketball_nba")
    assert result["source"] == "demo"
    assert Game.objects.count() >= 1
    assert ModelPrediction.objects.count() >= 1
    assert BestBet.objects.filter(is_published=True).count() == result["best_bets"]


@pytest.mark.django_db
def test_best_bets_served_from_db_after_refresh(client: APIClient) -> None:
    from predictions.tasks import refresh_predictions

    refresh_predictions("basketball_nba")
    resp = client.get("/api/best-bets/?sport=basketball_nba")
    assert resp.status_code == 200
    body = resp.json()
    assert body["source"] == "db"
    assert body["count"] >= 1
    assert "recommended_stake" in body["best_bets"][0]


@pytest.mark.django_db
def test_predictions_served_from_db_after_refresh(client: APIClient) -> None:
    from predictions.tasks import refresh_predictions

    refresh_predictions("basketball_nba")
    resp = client.get("/api/predictions/?sport=basketball_nba")
    assert resp.status_code == 200
    body = resp.json()
    assert body["source"] == "db"
    assert body["games"][0]["models"]  # `models` key present (shared shape)


# ── Saved bets (auth required) ────────────────────────────────────
@pytest.mark.django_db
def test_saved_bets_require_auth(client: APIClient) -> None:
    assert client.get("/api/saved-bets/").status_code == 401


@pytest.mark.django_db
def test_save_and_list_and_delete_bet(client: APIClient) -> None:
    from django.contrib.auth.models import User

    user = User.objects.create_user(username="s@e.com", email="s@e.com", password="S3cure-pass-1")
    client.force_authenticate(user=user)
    payload = {
        "external_id": "demo-arb-001", "sport_key": "basketball_nba",
        "home_team": "Lakers", "away_team": "Celtics", "market": "moneyline",
        "selection": "Lakers", "bookmaker": "DraftKings", "american_odds": 110,
        "model_probability": "0.6", "edge_pct": "12.38", "expected_value": "26.00",
    }
    r1 = client.post("/api/saved-bets/", payload, format="json")
    assert r1.status_code == 201
    # Saving the same pick again is idempotent (200, not a duplicate row).
    r2 = client.post("/api/saved-bets/", payload, format="json")
    assert r2.status_code == 200
    lst = client.get("/api/saved-bets/")
    assert lst.json()["count"] == 1
    bet_id = r1.json()["id"]
    assert client.delete(f"/api/saved-bets/{bet_id}/").status_code == 204
    assert client.get("/api/saved-bets/").json()["count"] == 0


# ── AI client (mocked HTTP) + pipeline helpers ────────────────────
@responses.activate
def test_ai_client_health_and_predict() -> None:
    from predictions.services.ai_client import AIServiceClient

    base = "http://ai-test:8001"
    responses.add(responses.GET, f"{base}/health", status=200)
    responses.add(responses.POST, f"{base}/predict", json={"predictions": [{"external_id": "g1"}]}, status=200)
    client = AIServiceClient(base_url=base)
    assert client.health() is True
    assert client.predict([{"external_id": "g1"}]) == [{"external_id": "g1"}]


def test_ai_client_health_false_on_connection_error() -> None:
    from predictions.services.ai_client import AIServiceClient

    # Nothing listening → health() must return False, never raise.
    assert AIServiceClient(base_url="http://127.0.0.1:9").health() is False


def test_games_from_odds_builds_moneyline_offer() -> None:
    from predictions.services.pipeline import games_from_odds

    events = [
        {
            "id": "e1", "home_team": "H", "away_team": "A", "sport_key": "basketball_nba",
            "bookmakers": [
                {"title": "DK", "markets": [
                    {"key": "h2h", "outcomes": [{"name": "H", "price": 120}, {"name": "A", "price": -140}]}
                ]},
                {"title": "FD", "markets": [
                    {"key": "h2h", "outcomes": [{"name": "H", "price": 135}, {"name": "A", "price": -150}]}
                ]},
            ],
        }
    ]
    games = games_from_odds(events)
    assert len(games) == 1
    ml = games[0]["market_odds"]["moneyline"]
    assert ml["selection"] == "H"
    assert ml["american"] == 135  # best (highest) home price across books
    assert ml["bookmaker"] == "FD"
