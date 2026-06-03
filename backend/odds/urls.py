from __future__ import annotations

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ArbitrageView, BookmakerViewSet, OddsView, ScoresView

router = DefaultRouter()
router.register("bookmakers", BookmakerViewSet, basename="bookmaker")

urlpatterns = [
    path("odds/", OddsView.as_view(), name="odds"),
    path("scores/", ScoresView.as_view(), name="scores"),
    path("arbitrage/", ArbitrageView.as_view(), name="arbitrage"),
    *router.urls,
]
