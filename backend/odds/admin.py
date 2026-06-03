from __future__ import annotations

from django.contrib import admin

from .models import Bookmaker


@admin.register(Bookmaker)
class BookmakerAdmin(admin.ModelAdmin):
    list_display = ["title", "key", "region", "is_active"]
    list_filter = ["region", "is_active"]
    search_fields = ["title", "key"]
    prepopulated_fields = {"key": ("title",)}
