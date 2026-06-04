from __future__ import annotations

from django.urls import path

from .views import HealthView, RefreshView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("internal/refresh/", RefreshView.as_view(), name="internal-refresh"),
]
