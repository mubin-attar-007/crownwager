"""Normalized prediction schema (replaces the legacy 43-column wide table).

Game ── 1:N ── ModelPrediction   (per-model win probabilities)
     └─ 1:N ── BestBet            (a +EV pick: probability vs. a book's odds → edge/EV/Kelly)
SavedBet                          (a user's saved pick — a snapshot, survives best-bet rotation)
"""
from __future__ import annotations

from django.contrib.auth.models import User
from django.db import models


class Game(models.Model):
    external_id = models.CharField(max_length=120, unique=True, db_index=True)
    sport_key = models.CharField(max_length=40, default="basketball_nba", db_index=True)
    sport_title = models.CharField(max_length=60, blank=True)
    home_team = models.CharField(max_length=80)
    away_team = models.CharField(max_length=80)
    commence_time = models.DateTimeField(db_index=True)

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        LIVE = "live", "Live"
        FINAL = "final", "Final"

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.SCHEDULED)
    home_score = models.IntegerField(null=True, blank=True)
    away_score = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["commence_time"]

    def __str__(self) -> str:
        return f"{self.away_team} @ {self.home_team} ({self.commence_time:%Y-%m-%d})"


class ModelPrediction(models.Model):
    class Model(models.TextChoices):
        NN = "nn", "Neural Network"
        XGBOOST = "xgboost", "XGBoost"
        ENSEMBLE = "ensemble", "Ensemble"

    class Market(models.TextChoices):
        MONEYLINE = "moneyline", "Moneyline"
        TOTAL = "total", "Over/Under"

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="predictions")
    model_name = models.CharField(max_length=10, choices=Model.choices)
    market = models.CharField(max_length=10, choices=Market.choices, default=Market.MONEYLINE)
    pick = models.CharField(max_length=80, help_text="Predicted winner / Over / Under.")
    win_probability = models.DecimalField(max_digits=5, decimal_places=4)
    confidence = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["game", "model_name", "market"], name="uniq_game_model_market"
            )
        ]

    def __str__(self) -> str:
        return f"{self.get_model_name_display()} · {self.game} → {self.pick}"


class BestBet(models.Model):
    """A surfaced +EV pick: model probability compared to a sportsbook's price."""

    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="best_bets")
    market = models.CharField(max_length=10, choices=ModelPrediction.Market.choices)
    selection = models.CharField(max_length=80)
    bookmaker = models.CharField(max_length=80)
    american_odds = models.IntegerField()
    decimal_odds = models.DecimalField(max_digits=7, decimal_places=3)
    model_probability = models.DecimalField(max_digits=5, decimal_places=4)
    edge_pct = models.DecimalField(max_digits=6, decimal_places=2)
    expected_value = models.DecimalField(max_digits=8, decimal_places=2, help_text="EV per 100 staked.")
    kelly_fraction = models.DecimalField(max_digits=6, decimal_places=4)
    confidence = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    is_published = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-edge_pct"]
        indexes = [models.Index(fields=["is_published", "-edge_pct"])]

    def __str__(self) -> str:
        return f"{self.selection} @ {self.american_odds} (edge {self.edge_pct}%)"


class SavedBet(models.Model):
    """A pick a user saved. Stored as a denormalized snapshot so it persists even after the
    rotating BestBet set is regenerated."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="saved_bets")
    external_id = models.CharField(max_length=120)
    sport_key = models.CharField(max_length=40, default="basketball_nba")
    home_team = models.CharField(max_length=80)
    away_team = models.CharField(max_length=80)
    commence_time = models.DateTimeField(null=True, blank=True)
    market = models.CharField(max_length=10)
    selection = models.CharField(max_length=80)
    bookmaker = models.CharField(max_length=80, blank=True)
    american_odds = models.IntegerField()
    model_probability = models.DecimalField(max_digits=5, decimal_places=4)
    edge_pct = models.DecimalField(max_digits=6, decimal_places=2)
    expected_value = models.DecimalField(max_digits=8, decimal_places=2)
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-saved_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "external_id", "market", "selection"], name="uniq_user_saved_bet"
            )
        ]

    def __str__(self) -> str:
        return f"{self.user.username} · {self.selection} ({self.edge_pct}%)"


class TrackedBet(models.Model):
    """A bet the user logged, for bankroll tracking (ROI, P/L, win rate). Real, user-entered data."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        WON = "won", "Won"
        LOST = "lost", "Lost"
        PUSH = "push", "Push"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tracked_bets")
    external_id = models.CharField(max_length=120, blank=True)
    sport_key = models.CharField(max_length=40, default="basketball_nba")
    home_team = models.CharField(max_length=80, blank=True)
    away_team = models.CharField(max_length=80, blank=True)
    market = models.CharField(max_length=20, default="moneyline")
    selection = models.CharField(max_length=80)
    bookmaker = models.CharField(max_length=80, blank=True)
    american_odds = models.IntegerField()
    stake = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    placed_at = models.DateTimeField(auto_now_add=True)
    settled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-placed_at"]
        indexes = [models.Index(fields=["user", "status"])]

    def __str__(self) -> str:
        return f"{self.user.username} · {self.selection} @ {self.american_odds} ({self.status})"
