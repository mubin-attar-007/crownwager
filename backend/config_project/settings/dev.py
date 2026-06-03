"""Development settings: relaxed security, console email, locmem cache fallback."""
from __future__ import annotations

from .base import *  # noqa: F401,F403

DEBUG = True
ALLOWED_HOSTS = ["*"]

# Email to console in dev (no SMTP credentials needed).
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Browsable API is handy in dev.
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (  # noqa: F405
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
)
