"""Editorial content: news/analysis articles and Betting-101 guides (admin-managed)."""
from __future__ import annotations

from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Article(models.Model):
    class Category(models.TextChoices):
        NEWS = "news", "News & Analysis"
        GUIDE = "guide", "Betting 101"

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    category = models.CharField(
        max_length=10, choices=Category.choices, default=Category.NEWS, db_index=True
    )
    summary = models.CharField(max_length=400, blank=True)
    body = models.TextField(help_text="Markdown or HTML body.")
    cover_image = models.ImageField(upload_to="articles/", blank=True)
    source = models.CharField(max_length=80, blank=True, help_text="e.g. ESPN, for ingested news.")
    source_url = models.URLField(blank=True, help_text="Original article link, for ingested news.")
    is_published = models.BooleanField(default=False, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]
        indexes = [models.Index(fields=["category", "is_published"])]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = slugify(self.title)[:220]
        if self.is_published and self.published_at is None:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)
