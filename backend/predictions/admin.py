from __future__ import annotations

from django.contrib import admin

from .models import BestBet, Game, ModelPrediction, SavedBet


class ModelPredictionInline(admin.TabularInline):
    model = ModelPrediction
    extra = 0


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ["__str__", "sport_key", "status", "commence_time"]
    list_filter = ["sport_key", "status"]
    search_fields = ["home_team", "away_team", "external_id"]
    inlines = [ModelPredictionInline]


@admin.register(BestBet)
class BestBetAdmin(admin.ModelAdmin):
    list_display = ["selection", "market", "bookmaker", "american_odds", "edge_pct", "is_published"]
    list_filter = ["is_published", "market"]
    search_fields = ["selection", "bookmaker"]


@admin.register(SavedBet)
class SavedBetAdmin(admin.ModelAdmin):
    list_display = ["user", "selection", "market", "american_odds", "edge_pct", "saved_at"]
    list_filter = ["market", "sport_key"]
    search_fields = ["user__username", "selection"]
