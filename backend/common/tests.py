"""Smoke tests for the foundation: health endpoint + OpenAPI schema."""
from __future__ import annotations

import pytest
from rest_framework.test import APIClient


@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.mark.django_db
def test_health_ok(client: APIClient) -> None:
    resp = client.get("/api/health/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["checks"]["database"] == "ok"


@pytest.mark.django_db
def test_openapi_schema_available(client: APIClient) -> None:
    resp = client.get("/api/schema/")
    assert resp.status_code == 200


@pytest.mark.django_db
def test_refresh_disabled_without_token(client: APIClient) -> None:
    # REFRESH_TOKEN defaults to "" → endpoint is hidden (404).
    assert client.post("/api/internal/refresh/").status_code == 404


@pytest.mark.django_db
def test_refresh_rejects_wrong_token(client: APIClient, settings) -> None:
    settings.REFRESH_TOKEN = "s3cret"
    assert client.post("/api/internal/refresh/").status_code == 404
    assert client.post("/api/internal/refresh/", HTTP_X_REFRESH_TOKEN="wrong").status_code == 404
