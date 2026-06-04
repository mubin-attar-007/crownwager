"""Root URL configuration. All app routes are mounted under /api/."""
from __future__ import annotations

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from common.views import ApiRootView

api_patterns = [
    path("", include("common.urls")),
    path("auth/", include("accounts.urls")),
    path("", include("odds.urls")),
    path("", include("predictions.urls")),
    path("", include("content.urls")),
    path("", include("assistant.urls")),
]

urlpatterns: list = [
    path("", ApiRootView.as_view(), name="api-root"),
    # Admin path is configurable (set ADMIN_URL to a non-obvious value in prod).
    path(settings.ADMIN_URL, admin.site.urls),
    path("api/", include(api_patterns)),
]

# OpenAPI docs: dev only by default (set ENABLE_API_DOCS=true to expose in prod).
if settings.ENABLE_API_DOCS:
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
        path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
