from __future__ import annotations

from rest_framework import serializers

from .models import BestBet, Game, ModelPrediction, SavedBet, TrackedBet
from .services.staking import bet_profit


class ModelPredictionSerializer(serializers.ModelSerializer):
    model_label = serializers.CharField(source="get_model_name_display", read_only=True)

    class Meta:
        model = ModelPrediction
        fields = [
            "model_name", "model_label", "market", "pick",
            "win_probability", "confidence", "created_at",
        ]


class GameSerializer(serializers.ModelSerializer):
    # Exposed as `models` so the DB-read and live-pipeline responses share one shape.
    models = ModelPredictionSerializer(many=True, read_only=True, source="predictions")

    class Meta:
        model = Game
        fields = [
            "external_id", "sport_key", "sport_title", "home_team", "away_team",
            "commence_time", "status", "home_score", "away_score", "models",
        ]


class SavedBetSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedBet
        fields = [
            "id", "external_id", "sport_key", "home_team", "away_team", "commence_time",
            "market", "selection", "bookmaker", "american_odds",
            "model_probability", "edge_pct", "expected_value", "saved_at",
        ]
        read_only_fields = ["id", "saved_at"]


class TrackedBetSerializer(serializers.ModelSerializer):
    profit = serializers.SerializerMethodField()

    class Meta:
        model = TrackedBet
        fields = [
            "id", "external_id", "sport_key", "home_team", "away_team", "market", "selection",
            "bookmaker", "american_odds", "stake", "status", "profit", "placed_at", "settled_at",
        ]
        read_only_fields = ["id", "profit", "placed_at", "settled_at"]

    def get_profit(self, obj) -> str:
        return str(bet_profit(obj.status, obj.american_odds, obj.stake))


def bestbet_to_dict(bb) -> dict:
    """Flatten a BestBet row into the same shape compute_best_bets() produces (one response shape)."""
    g = bb.game
    return {
        "external_id": g.external_id,
        "home_team": g.home_team,
        "away_team": g.away_team,
        "sport_key": g.sport_key,
        "sport_title": g.sport_title,
        "commence_time": g.commence_time.isoformat() if g.commence_time else None,
        "market": bb.market,
        "selection": bb.selection,
        "bookmaker": bb.bookmaker,
        "american_odds": bb.american_odds,
        "decimal_odds": str(bb.decimal_odds),
        "model_probability": str(bb.model_probability),
        "edge_pct": str(bb.edge_pct),
        "expected_value": str(bb.expected_value),
        "kelly_fraction": str(bb.kelly_fraction),
        "confidence": str(bb.confidence),
    }


class BestBetSerializer(serializers.ModelSerializer):
    game = GameSerializer(read_only=True)

    class Meta:
        model = BestBet
        fields = [
            "id", "game", "market", "selection", "bookmaker",
            "american_odds", "decimal_odds", "model_probability",
            "edge_pct", "expected_value", "kelly_fraction", "confidence", "created_at",
        ]
