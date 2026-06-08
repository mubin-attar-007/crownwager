"""Cookie-JWT auth: login sets cookies, the cookie authenticates, logout clears (flag-gated)."""
from __future__ import annotations

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

PW = "Sup3rSecret!pw"
EMAIL = "cookie@example.com"


@pytest.fixture()
def api() -> APIClient:
    return APIClient()


@pytest.fixture()
def user(db):
    return User.objects.create_user(username=EMAIL, email=EMAIL, password=PW)


def _login(api: APIClient):
    return api.post("/api/auth/login/", {"username": EMAIL, "password": PW}, format="json")


def test_login_sets_cookies_when_enabled(api, user, settings) -> None:
    settings.AUTH_COOKIE_ENABLED = True
    resp = _login(api)
    assert resp.status_code == 200
    assert "cw_access" in resp.cookies
    assert "cw_refresh" in resp.cookies
    assert resp.cookies["cw_access"]["httponly"]


def test_cookie_authenticates_me(api, user, settings) -> None:
    settings.AUTH_COOKIE_ENABLED = True
    _login(api)  # cookies land in the client's jar
    resp = api.get("/api/auth/me/")  # no Authorization header — cookie only
    assert resp.status_code == 200
    assert resp.json()["email"] == EMAIL


def test_logout_clears_cookies(api, user, settings) -> None:
    settings.AUTH_COOKIE_ENABLED = True
    _login(api)
    resp = api.post("/api/auth/logout/")
    assert resp.status_code == 204
    assert resp.cookies["cw_access"].value == ""  # deletion = empty value


def test_no_cookies_when_disabled(api, user, settings) -> None:
    settings.AUTH_COOKIE_ENABLED = False
    resp = _login(api)
    assert resp.status_code == 200
    assert "cw_access" not in resp.cookies  # backward compatible: body-only
