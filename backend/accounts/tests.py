"""Tests for the registration → JWT → profile flow, including the legacy 500-bug regression."""
from __future__ import annotations

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from .models import Profile


@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.mark.django_db
def test_register_creates_user_profile_and_tokens(client: APIClient) -> None:
    resp = client.post(
        "/api/auth/register/",
        {
            "email": "Bettor@example.com",
            "first_name": "Sam",
            "last_name": "Stake",
            "password": "S3cure-pass-1",
        },
        format="json",
    )
    assert resp.status_code == 201, resp.content
    data = resp.json()
    assert data["access"] and data["refresh"]
    # Email normalized + used as username; profile auto-created by signal.
    user = User.objects.get(email="bettor@example.com")
    assert user.username == "bettor@example.com"
    assert Profile.objects.filter(user=user).exists()


@pytest.mark.django_db
def test_duplicate_email_rejected(client: APIClient) -> None:
    User.objects.create_user(username="dup@example.com", email="dup@example.com", password="x")
    resp = client.post(
        "/api/auth/register/",
        {"email": "dup@example.com", "first_name": "A", "last_name": "B", "password": "S3cure-pass-1"},
        format="json",
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_me_requires_auth_returns_401_not_500(client: APIClient) -> None:
    # Legacy bug: anonymous profile_view raised 500. Now it must be a clean 401.
    resp = client.get("/api/auth/me/")
    assert resp.status_code == 401


@pytest.mark.django_db
def test_me_returns_profile_when_authenticated(client: APIClient) -> None:
    user = User.objects.create_user(
        username="me@example.com", email="me@example.com", password="S3cure-pass-1"
    )
    client.force_authenticate(user=user)
    resp = client.get("/api/auth/me/")
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@example.com"
    assert "profile" in resp.json()
