"""Predictions + Best-Bets endpoints.

Read order: persisted DB rows (populated by the Celery task / refresh command) → live pipeline
(odds + AI) → demo data. One response shape regardless of source. ``recommended_stake`` is computed
per-request from the authenticated user's bankroll + Kelly fraction.
"""
from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BestBet, Game, SavedBet
from .serializers import GameSerializer, SavedBetSerializer, bestbet_to_dict
from .services.best_bets import compute_best_bets
from .services.pipeline import gather_predictions
from .services.staking import recommended_stake

DEFAULT_SPORT = "basketball_nba"
DISCLAIMER = "Informational only. Not financial advice. 18+. Please bet responsibly."


def _demo_flag(source: str) -> bool:
    """Demo unless we have a live Odds API key and the data came from the live pipeline."""
    if source == "live":
        return False
    if source == "db":
        return not bool(settings.ODDS_API_KEY)
    return True


class PredictionsView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        parameters=[OpenApiParameter("sport", str, default=DEFAULT_SPORT)],
        description="Model predictions (NN / XGBoost / ensemble) per game. DB → live → demo.",
    )
    def get(self, request: Request) -> Response:
        sport = request.query_params.get("sport", DEFAULT_SPORT)
        db_games = Game.objects.filter(sport_key=sport).prefetch_related("predictions")
        if db_games.exists():
            data = GameSerializer(db_games, many=True).data
            source = "db"
        else:
            data, source = gather_predictions(sport)
        return Response(
            {"sport": sport, "demo": _demo_flag(source), "source": source, "count": len(data), "games": data}
        )


class BestBetsView(APIView):
    """Daily +EV best bets: model probability vs. market odds → edge, EV, Kelly stake."""

    permission_classes = [AllowAny]

    @extend_schema(
        parameters=[
            OpenApiParameter("sport", str, default=DEFAULT_SPORT),
            OpenApiParameter("min_edge", str, default="0", description="Minimum edge %% to include."),
        ],
        description="Ranked +EV picks. DB → live → demo. Personalizes stake when logged in.",
    )
    def get(self, request: Request) -> Response:
        sport = request.query_params.get("sport", DEFAULT_SPORT)
        try:
            min_edge = Decimal(request.query_params.get("min_edge", "0"))
        except Exception:
            min_edge = Decimal("0")

        db_bets = (
            BestBet.objects.filter(is_published=True, game__sport_key=sport, edge_pct__gte=min_edge)
            .select_related("game")
            .order_by("-edge_pct")
        )
        if db_bets.exists():
            bets = [bestbet_to_dict(b) for b in db_bets]
            source = "db"
        else:
            preds, source = gather_predictions(sport)
            bets = compute_best_bets(preds, min_edge=min_edge)

        # Personalize recommended stake from the logged-in user's bankroll / Kelly fraction.
        bankroll = Decimal("1000")
        frac = Decimal("0.5")
        if request.user.is_authenticated and hasattr(request.user, "profile"):
            bankroll = request.user.profile.bankroll
            frac = request.user.profile.kelly_fraction
        for b in bets:
            b["recommended_stake"] = str(
                recommended_stake(b["model_probability"], b["american_odds"], bankroll, frac)
            )

        return Response(
            {
                "sport": sport,
                "demo": _demo_flag(source),
                "source": source,
                "bankroll": str(bankroll),
                "kelly_fraction": str(frac),
                "count": len(bets),
                "best_bets": bets,
                "disclaimer": DISCLAIMER,
            }
        )


class SavedBetViewSet(viewsets.ModelViewSet):
    """A user's saved picks (auth required). Snapshots survive best-bet rotation."""

    serializer_class = SavedBetSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        return SavedBet.objects.filter(user=self.request.user)

    def create(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj, created = SavedBet.objects.get_or_create(
            user=request.user,
            external_id=serializer.validated_data["external_id"],
            market=serializer.validated_data["market"],
            selection=serializer.validated_data["selection"],
            defaults=serializer.validated_data,
        )
        out = self.get_serializer(obj)
        return Response(out.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
