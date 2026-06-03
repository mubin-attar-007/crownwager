from __future__ import annotations

from rest_framework import serializers

from .models import Bookmaker


class BookmakerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookmaker
        fields = ["id", "key", "title", "url", "region", "logo", "is_active"]
