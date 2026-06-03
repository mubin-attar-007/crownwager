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
