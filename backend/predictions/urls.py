from __future__ import annotations

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    BankrollStatsView,
    BestBetsView,
    ModelRecordView,
    PredictionsView,
    SavedBetViewSet,
    TrackedBetViewSet,
)

router = DefaultRouter()
router.register("saved-bets", SavedBetViewSet, basename="saved-bet")
router.register("tracked-bets", TrackedBetViewSet, basename="tracked-bet")

urlpatterns = [
    path("predictions/", PredictionsView.as_view(), name="predictions"),
    path("best-bets/", BestBetsView.as_view(), name="best-bets"),
    path("model-record/", ModelRecordView.as_view(), name="model-record"),
    path("bankroll/stats/", BankrollStatsView.as_view(), name="bankroll-stats"),
    *router.urls,
]
