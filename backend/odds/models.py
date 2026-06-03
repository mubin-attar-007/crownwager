"""Bookmaker directory — admin-managed, replacing the legacy hardcoded BOOKMAKER_URLS dict."""
from __future__ import annotations

from django.db import models


class Bookmaker(models.Model):
    key = models.SlugField(max_length=60, unique=True, help_text="The Odds API bookmaker key.")
    title = models.CharField(max_length=100)
    url = models.URLField(blank=True)
    region = models.CharField(max_length=10, default="us")
    logo = models.ImageField(upload_to="bookmakers/", blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title
