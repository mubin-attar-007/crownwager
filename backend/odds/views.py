"""Odds, scores, and arbitrage endpoints.

All upstream calls degrade gracefully: if no API key is configured or the upstream errors, the
endpoint returns clearly-labelled demo data (``"demo": true``) so the product always works in a
demo/college setting. Business logic lives in ``services/`` (testable, Django-free).
"""
from __future__ import annotations

from decimal import Decimal, InvalidOperation

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .fixtures_demo import DEMO_ODDS, DEMO_SCORES
from .models import Bookmaker
from .serializers import BookmakerSerializer
from .services.arbitrage import find_arbitrage
from .services.odds_api import OddsAPIClient, OddsAPIError

DEFAULT_SPORT = "basketball_nba"


class BookmakerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Bookmaker.objects.filter(is_active=True)
    serializer_class = BookmakerSerializer
    permission_classes = [AllowAny]


class OddsView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        parameters=[
            OpenApiParameter("sport", str, description="Odds API sport key.", default=DEFAULT_SPORT),
            OpenApiParameter("markets", str, default="h2h"),
        ],
        description="Live odds across sportsbooks for a sport. Falls back to demo data.",
    )
    def get(self, request: Request) -> Response:
        sport = request.query_params.get("sport", DEFAULT_SPORT)
        markets = request.query_params.get("markets", "h2h")
        demo = False
        try:
            data = OddsAPIClient().fetch_odds(sport=sport, markets=markets)
        except OddsAPIError:
            data, demo = DEMO_ODDS, True
        return Response({"sport": sport, "demo": demo, "count": len(data), "events": data})


class ScoresView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        parameters=[
            OpenApiParameter("sport", str, default=DEFAULT_SPORT),
            OpenApiParameter("days_from", int, default=3),
        ],
        description="Recent and live scores for a sport. Falls back to demo data.",
    )
    def get(self, request: Request) -> Response:
        sport = request.query_params.get("sport", DEFAULT_SPORT)
        try:
            days_from = int(request.query_params.get("days_from", 3))
        except (TypeError, ValueError):
            days_from = 3
        demo = False
        try:
            data = OddsAPIClient().fetch_scores(sport=sport, days_from=days_from)
        except OddsAPIError:
            data, demo = DEMO_SCORES, True
        return Response({"sport": sport, "demo": demo, "count": len(data), "scores": data})


class ArbitrageView(APIView):
    """Scan a sport's h2h markets for guaranteed-profit arbitrage opportunities."""

    permission_classes = [AllowAny]

    @extend_schema(
        parameters=[
            OpenApiParameter("sport", str, default=DEFAULT_SPORT),
            OpenApiParameter("bet_size", str, default="100"),
        ],
        description="Find arbitrage opportunities. Money math uses Decimal. Falls back to demo data.",
    )
    def get(self, request: Request) -> Response:
        sport = request.query_params.get("sport", DEFAULT_SPORT)
        raw_size = request.query_params.get("bet_size", "100")
        try:
            bet_size = Decimal(raw_size)
            if bet_size <= 0:
                raise InvalidOperation
        except (InvalidOperation, ValueError):
            return Response({"detail": "bet_size must be a positive number."}, status=400)

        demo = False
        try:
            events = OddsAPIClient().fetch_odds(sport=sport, markets="h2h")
        except OddsAPIError:
            events, demo = DEMO_ODDS, True

        opportunities = find_arbitrage(events, bet_size)
        return Response(
            {
                "sport": sport,
                "bet_size": str(bet_size),
                "demo": demo,
                "count": len(opportunities),
                "opportunities": opportunities,
            }
        )
