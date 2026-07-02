"""Tests for the registration → JWT → profile flow, including the legacy 500-bug regression."""
from __future__ import annotations

import pytest
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
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


@pytest.mark.django_db
def test_change_password(client: APIClient) -> None:
    user = User.objects.create_user(
        username="c@example.com", email="c@example.com", password="Old-pass-123"
    )
    client.force_authenticate(user=user)
    # Wrong current password is rejected.
    bad = client.post(
        "/api/auth/change-password/",
        {"old_password": "wrong", "new_password": "New-pass-456"},
        format="json",
    )
    assert bad.status_code == 400
    # Correct current password succeeds and the new one takes effect.
    ok = client.post(
        "/api/auth/change-password/",
        {"old_password": "Old-pass-123", "new_password": "New-pass-456"},
        format="json",
    )
    assert ok.status_code == 200
    user.refresh_from_db()
    assert user.check_password("New-pass-456")


@pytest.mark.django_db
def test_delete_account_requires_password(client: APIClient) -> None:
    user = User.objects.create_user(
        username="d@example.com", email="d@example.com", password="Del-pass-123"
    )
    client.force_authenticate(user=user)
    assert (
        client.post("/api/auth/delete/", {"password": "wrong"}, format="json").status_code == 400
    )
    ok = client.post("/api/auth/delete/", {"password": "Del-pass-123"}, format="json")
    assert ok.status_code == 204
    assert not User.objects.filter(pk=user.pk).exists()


@pytest.mark.django_db
def test_password_reset_flow(client: APIClient) -> None:
    user = User.objects.create_user(
        username="r@example.com", email="r@example.com", password="Reset-me-123"
    )
    # Generic 200 even for an unknown email (no account enumeration).
    assert (
        client.post(
            "/api/auth/password-reset/", {"email": "nobody@example.com"}, format="json"
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/auth/password-reset/", {"email": "r@example.com"}, format="json"
        ).status_code
        == 200
    )
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    # A bad token is rejected.
    bad = client.post(
        "/api/auth/password-reset-confirm/",
        {"uid": uid, "token": "bad-token", "new_password": "Fresh-pass-999"},
        format="json",
    )
    assert bad.status_code == 400
    # A valid token resets the password.
    ok = client.post(
        "/api/auth/password-reset-confirm/",
        {"uid": uid, "token": token, "new_password": "Fresh-pass-999"},
        format="json",
    )
    assert ok.status_code == 200
    user.refresh_from_db()
    assert user.check_password("Fresh-pass-999")
