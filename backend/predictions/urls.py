from __future__ import annotations

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import BestBetsView, PredictionsView, SavedBetViewSet

router = DefaultRouter()
router.register("saved-bets", SavedBetViewSet, basename="saved-bet")

urlpatterns = [
    path("predictions/", PredictionsView.as_view(), name="predictions"),
    path("best-bets/", BestBetsView.as_view(), name="best-bets"),
    *router.urls,
]
