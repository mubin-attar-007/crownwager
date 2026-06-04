"""Health, liveness, and a token-guarded scheduled-refresh endpoint."""
from __future__ import annotations

from django.conf import settings
from django.db import connection
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    """Returns service health, including a database connectivity probe."""

    permission_classes = [AllowAny]
    throttle_classes: list = []

    @extend_schema(
        responses={200: dict, 503: dict},
        description="Liveness/readiness probe. Checks DB connectivity.",
    )
    def get(self, request: Request) -> Response:
        db_ok = True
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception:  # pragma: no cover
            db_ok = False

        payload = {
            "status": "ok" if db_ok else "degraded",
            "service": "oddsaway-api",
            "version": "0.1.0",
            "checks": {"database": "ok" if db_ok else "error"},
        }
        code = status.HTTP_200_OK if db_ok else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(payload, status=code)


class RefreshView(APIView):
    """Token-guarded endpoint to refresh predictions + news. Called by a scheduled GitHub Action
    (free Render has no always-on Celery worker). Disabled unless REFRESH_TOKEN is configured."""

    permission_classes = [AllowAny]
    throttle_classes: list = []

    @extend_schema(description="Internal: refresh predictions + news. Requires X-Refresh-Token header.")
    def post(self, request: Request) -> Response:
        token = settings.REFRESH_TOKEN
        if not token or request.headers.get("X-Refresh-Token") != token:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        from content.services import fetch_and_store_news
        from predictions.tasks import refresh_all_predictions

        predictions = refresh_all_predictions()
        news = fetch_and_store_news()
        return Response({"predictions": predictions, "news": news})
