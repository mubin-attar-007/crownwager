"""User profile. Carries forward the legacy email-as-username + phone-validation patterns,
adds a bankroll + risk settings used by the Kelly-criterion staking recommendations."""
from __future__ import annotations

from decimal import Decimal

from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, RegexValidator
from django.db import models

PHONE_VALIDATOR = RegexValidator(
    regex=r"^\+?1?\d{9,15}$",
    message="Phone number must be entered in the format '+999999999'. Up to 15 digits allowed.",
)


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone_number = models.CharField(max_length=15, blank=True, validators=[PHONE_VALIDATOR])
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True)

    # Personalization for staking recommendations (Kelly criterion).
    bankroll = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("1000.00"),
        validators=[MinValueValidator(Decimal("0"))],
        help_text="User's notional bankroll used to size recommended stakes (informational only).",
    )
    kelly_fraction = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=Decimal("0.50"),
        validators=[MinValueValidator(Decimal("0"))],
        help_text="Fraction of full Kelly to apply (e.g. 0.50 = half-Kelly, a common risk control).",
    )
    favorite_sport = models.CharField(max_length=40, blank=True, default="basketball_nba")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user__username"]

    def __str__(self) -> str:
        full = self.user.get_full_name()
        return f"{full} ({self.user.username})" if full else self.user.username
