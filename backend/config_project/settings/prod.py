"""Production settings: security headers hardened, secrets required from the environment."""
from __future__ import annotations

from .base import *  # noqa: F401,F403
from .env import env

DEBUG = False

# Fail loudly if a real secret key wasn't provided.
if SECRET_KEY == "dev-insecure-secret-key-change-me":  # noqa: F405
    raise RuntimeError("SECRET_KEY must be set via the environment in production.")

# ── HTTPS / security headers (fixes the legacy gap of no SECURE_* in prod) ──
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 31_536_000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
X_FRAME_OPTIONS = "DENY"

# ── Email via SMTP (credentials from env only) ─────────────────────
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env.email_host
EMAIL_PORT = env.email_port
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env.email_host_user
EMAIL_HOST_PASSWORD = env.email_host_password

# Drop the browsable API in prod (JSON only).
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
)
