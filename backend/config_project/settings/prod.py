"""Production settings: hardened for a public deployment.

Fails fast (at import) if it's misconfigured in a dangerous way — a missing secret, a wildcard host,
or a localhost CORS origin — so an insecure config can never reach production silently.
"""
from __future__ import annotations

from .base import *  # noqa: F401,F403
from .env import env

DEBUG = False

# ── Fail-fast configuration guards ─────────────────────────────────
if SECRET_KEY == "dev-insecure-secret-key-change-me":  # noqa: F405
    raise RuntimeError("SECRET_KEY must be set via the environment in production.")

if not ALLOWED_HOSTS or "*" in ALLOWED_HOSTS:  # noqa: F405
    raise RuntimeError("ALLOWED_HOSTS must list your real domain(s) in production (no '*').")

_cors = CORS_ALLOWED_ORIGINS  # noqa: F405
if not _cors or any(("localhost" in o or "*" in o) for o in _cors):
    raise RuntimeError(
        "CORS_ALLOWED_ORIGINS must be your real frontend origin(s) in production "
        "(no localhost, no '*'). Set it via the CORS_ALLOWED_ORIGINS env var."
    )

# ── HTTPS / transport security (assumes TLS terminated at the edge) ─
SECURE_SSL_REDIRECT = env.secure_ssl_redirect
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 31_536_000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ── Cookies (secure, http-only, strict same-site) ──────────────────
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Strict"
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = "Strict"
# JWT auth cookies are always Secure in production (required when SAMESITE="None" for a
# cross-origin SPA). Set AUTH_COOKIE_SAMESITE=None via env once the frontend uses cookies.
AUTH_COOKIE_SECURE = True

# ── Email via SMTP (credentials from env only) ─────────────────────
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env.email_host
EMAIL_PORT = env.email_port
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env.email_host_user
EMAIL_HOST_PASSWORD = env.email_host_password

# JSON only in prod (no browsable API).
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
)
