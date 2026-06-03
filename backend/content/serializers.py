from __future__ import annotations

from rest_framework import serializers

from .models import Article


class ArticleListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = ["id", "title", "slug", "category", "summary", "cover_image", "published_at"]


class ArticleDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = [
            "id", "title", "slug", "category", "summary", "body",
            "cover_image", "published_at", "updated_at",
        ]
