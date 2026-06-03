"""Tests for the arbitrage algorithm (pure, Decimal) and the odds/arbitrage endpoints."""
from __future__ import annotations

from decimal import Decimal

import pytest
import responses
from rest_framework.test import APIClient

from .fixtures_demo import DEMO_ODDS
from .services.arbitrage import best_odds_per_outcome, evaluate_event, find_arbitrage
from .services.odds_api import OddsAPIClient, OddsAPIError

ODDS_URL = "https://api.the-odds-api.com/v4/sports/basketball_nba/odds/"


# ── Pure algorithm ────────────────────────────────────────────────
def test_best_odds_picks_highest_price_across_books() -> None:
    best = best_odds_per_outcome(DEMO_ODDS[0])
    assert best["Los Angeles Lakers"].price == Decimal("2.10")
    assert best["Los Angeles Lakers"].bookmaker == "DraftKings"
    assert best["Boston Celtics"].price == Decimal("2.10")
    assert best["Boston Celtics"].bookmaker == "FanDuel"


def test_arbitrage_detected_with_decimal_math() -> None:
    opp = evaluate_event(DEMO_ODDS[0], Decimal("100"))
    assert opp is not None
    # implied_total = 1/2.10 + 1/2.10 = 0.95238...
    assert opp.implied_total < Decimal("1")
    # ~5% guaranteed profit
    assert opp.profit > Decimal("4.5")
    # Stakes should sum to ~the bet size and each leg returns ~equal payout.
    total_staked = sum(Decimal(leg["stake"]) for leg in opp.legs)
    assert abs(total_staked - Decimal("100")) < Decimal("0.05")


def test_no_arbitrage_when_margin_present() -> None:
    # Second demo event has a bookmaker margin (1/1.91 + 1/1.95 > 1) → no arb.
    assert evaluate_event(DEMO_ODDS[1], Decimal("100")) is None


def test_find_arbitrage_sorts_and_filters() -> None:
    results = find_arbitrage(DEMO_ODDS, Decimal("100"))
    assert len(results) == 1
    assert results[0]["event_id"] == "demo-arb-001"
    assert Decimal(results[0]["profit_pct"]) > 0


def test_find_arbitrage_handles_floats_safely() -> None:
    # Floats coerced via Decimal(str(...)) — no precision artifacts.
    results = find_arbitrage(DEMO_ODDS, 100.0)
    assert results and Decimal(results[0]["bet_size"]) == Decimal("100.00")


# ── Endpoints (demo fallback path, no API key) ────────────────────
@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.mark.django_db
def test_arbitrage_endpoint_demo_mode(client: APIClient) -> None:
    resp = client.get("/api/arbitrage/?sport=basketball_nba&bet_size=100")
    assert resp.status_code == 200
    body = resp.json()
    assert body["demo"] is True
    assert body["count"] == 1
    assert body["opportunities"][0]["event_id"] == "demo-arb-001"


@pytest.mark.django_db
def test_arbitrage_endpoint_rejects_bad_bet_size(client: APIClient) -> None:
    resp = client.get("/api/arbitrage/?bet_size=-5")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_odds_endpoint_demo_mode(client: APIClient) -> None:
    resp = client.get("/api/odds/?sport=basketball_nba")
    assert resp.status_code == 200
    assert resp.json()["demo"] is True


# ── Odds API client (mocked HTTP) ─────────────────────────────────
def test_odds_client_no_key_raises() -> None:
    with pytest.raises(OddsAPIError):
        OddsAPIClient(api_key="").fetch_odds("basketball_nba", use_cache=False)


@responses.activate
def test_odds_client_fetches_and_parses() -> None:
    responses.add(responses.GET, ODDS_URL, json=[{"id": "evt-1"}], status=200)
    data = OddsAPIClient(api_key="test-key").fetch_odds("basketball_nba", use_cache=False)
    assert data == [{"id": "evt-1"}]


@responses.activate
def test_odds_client_http_error_becomes_oddsapierror() -> None:
    responses.add(responses.GET, ODDS_URL, status=500)
    with pytest.raises(OddsAPIError):
        OddsAPIClient(api_key="test-key").fetch_odds("basketball_nba", use_cache=False)
