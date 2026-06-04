"""Predictions + Best-Bets endpoints.

Read order: persisted DB rows (populated by the Celery task / refresh command) → live pipeline
(odds + AI) → demo data. One response shape regardless of source. ``recommended_stake`` is computed
per-request from the authenticated user's bankroll + Kelly fraction.
"""
from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BestBet, Game, SavedBet, TrackedBet
from .serializers import GameSerializer, SavedBetSerializer, TrackedBetSerializer, bestbet_to_dict
from .services.best_bets import compute_best_bets
from .services.pipeline import gather_predictions
from .services.staking import bet_profit, recommended_stake

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


class TrackedBetViewSet(viewsets.ModelViewSet):
    """A user's logged bets, for bankroll tracking (auth required)."""

    serializer_class = TrackedBetSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        return TrackedBet.objects.filter(user=self.request.user)

    def perform_create(self, serializer) -> None:
        serializer.save(user=self.request.user)

    def perform_update(self, serializer) -> None:
        # Stamp settlement time when a bet moves out of "pending".
        instance = serializer.save()
        if instance.status != TrackedBet.Status.PENDING and instance.settled_at is None:
            instance.settled_at = timezone.now()
            instance.save(update_fields=["settled_at"])


class BankrollStatsView(APIView):
    """Real bankroll analytics computed from the user's settled bets."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        bets = list(TrackedBet.objects.filter(user=request.user).order_by("placed_at"))
        settled = [b for b in bets if b.status in ("won", "lost", "push")]
        wins = sum(1 for b in settled if b.status == "won")
        losses = sum(1 for b in settled if b.status == "lost")
        pushes = sum(1 for b in settled if b.status == "push")
        staked = sum((b.stake for b in settled), Decimal("0"))
        profit = sum((bet_profit(b.status, b.american_odds, b.stake) for b in settled), Decimal("0"))
        roi = (profit / staked * 100) if staked else Decimal("0")
        decided = wins + losses
        win_rate = (Decimal(wins) / Decimal(decided) * 100) if decided else Decimal("0")

        # Cumulative-profit growth series (one point per settled bet, in order).
        running = Decimal("0")
        growth = []
        for b in settled:
            running += bet_profit(b.status, b.american_odds, b.stake)
            growth.append({
                "at": (b.settled_at or b.placed_at).isoformat(),
                "cumulative_profit": str(running.quantize(Decimal("0.01"))),
            })

        pending = [b for b in bets if b.status == "pending"]
        return Response({
            "record": f"{wins}-{losses}-{pushes}",
            "wins": wins, "losses": losses, "pushes": pushes,
            "total_staked": str(staked.quantize(Decimal("0.01"))),
            "total_profit": str(profit.quantize(Decimal("0.01"))),
            "roi_pct": str(roi.quantize(Decimal("0.01"))),
            "win_rate_pct": str(win_rate.quantize(Decimal("0.01"))),
            "settled_count": len(settled),
            "pending_count": len(pending),
            "pending_stake": str(sum((b.stake for b in pending), Decimal("0")).quantize(Decimal("0.01"))),
            "growth": growth,
        })
