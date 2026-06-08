"""Shared Django settings. Environment-specific overrides live in dev.py / prod.py."""
from __future__ import annotations

from datetime import timedelta
from pathlib import Path

import dj_database_url

from .env import env

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ── Error tracking (Sentry; no-op unless SENTRY_DSN is set) ─────────
if env.sentry_dsn:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=env.sentry_dsn,
        environment=env.django_env,
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,
    )

# ── Security ───────────────────────────────────────────────────────
SECRET_KEY = env.secret_key
DEBUG = env.debug
ALLOWED_HOSTS = env.allowed_hosts_list

# Baseline security headers (safe in every environment; prod.py adds HTTPS-only ones).
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"

# ── Applications ───────────────────────────────────────────────────
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]
THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "corsheaders",
    "django_filters",
    "django_celery_beat",
]
LOCAL_APPS = [
    "common",
    "accounts",
    "odds",
    "predictions",
    "content",
    "assistant",
]
INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config_project.urls"
WSGI_APPLICATION = "config_project.wsgi.application"
ASGI_APPLICATION = "config_project.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ── Database ───────────────────────────────────────────────────────
DATABASES = {
    "default": dj_database_url.parse(env.database_url, conn_max_age=600, conn_health_checks=True),
}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── Cache (Redis in Docker/prod, in-process for local dev) ─────────
if env.cache_backend.lower() == "redis":
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": env.redis_url,
        }
    }
else:
    CACHES = {
        "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
    }

# ── Authentication ─────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ── DRF + JWT + OpenAPI ────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        # Cookie-aware JWT: reads the HttpOnly access cookie, else the Authorization header
        # (so existing Bearer clients keep working unchanged).
        "accounts.authentication.CookieJWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticatedOrReadOnly",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend",),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    # `assistant` is a strict scope for the LLM-backed CrownBot endpoint (cost/abuse control).
    "DEFAULT_THROTTLE_RATES": {"anon": "60/min", "user": "240/min", "assistant": "10/min"},
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
    # Trust N front proxies so per-IP throttling uses the real client IP (X-Forwarded-For),
    # not the shared edge IP. Set NUM_PROXIES=1 in prod (Render); 0 locally.
    "NUM_PROXIES": env.num_proxies,
}

# ── JWT (short access token + rotating, blacklisted refresh) ────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}

# ── Auth cookies (opt-in; see accounts/authentication.py + accounts/views.py) ──────
# When AUTH_COOKIE_ENABLED, login/register/refresh also set the JWT as HttpOnly cookies.
# Backward compatible: the Authorization: Bearer header still works.
AUTH_COOKIE_ENABLED = env.auth_cookie_enabled
AUTH_ACCESS_COOKIE = "cw_access"
AUTH_REFRESH_COOKIE = "cw_refresh"
AUTH_COOKIE_SAMESITE = env.auth_cookie_samesite  # "Lax" same-origin; "None" cross-origin (+ Secure)
AUTH_COOKIE_SECURE = False  # overridden to True in prod.py
AUTH_COOKIE_PATH = "/"

SPECTACULAR_SETTINGS = {
    "TITLE": "CrownWager API",
    "DESCRIPTION": "Sports-betting analytics & predictions — best bets, odds, arbitrage, ML picks. "
    "Informational only; no real-money wagering. 18+. Please bet responsibly.",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# ── i18n / tz ──────────────────────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ── Static / media ─────────────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ── CORS ───────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = env.cors_origins_list

# ── Celery ─────────────────────────────────────────────────────────
CELERY_BROKER_URL = env.redis_url
CELERY_RESULT_BACKEND = env.redis_url
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
# DatabaseScheduler syncs these entries into the DB on startup.
CELERY_BEAT_SCHEDULE = {
    "refresh-predictions-every-30-min": {
        "task": "predictions.tasks.refresh_all_predictions",
        "schedule": 1800.0,
    },
    "refresh-news-every-3-hours": {
        "task": "content.tasks.refresh_news",
        "schedule": 3 * 3600.0,
    },
}

# ── Project-specific (consumed by services) ────────────────────────
ODDS_API_KEY = env.odds_api_key
ODDS_API_BASE_URL = env.odds_api_base_url
AI_SERVICE_URL = env.ai_service_url
REFRESH_TOKEN = env.refresh_token
ANTHROPIC_API_KEY = env.anthropic_api_key
LLM_API_KEY = env.llm_api_key
LLM_BASE_URL = env.llm_base_url
LLM_MODEL = env.llm_model

# ── Admin path + API docs visibility ───────────────────────────────
ADMIN_URL = env.admin_url.strip("/") + "/"
# Docs are off by default; dev.py turns them on, prod can opt in via ENABLE_API_DOCS env var.
ENABLE_API_DOCS = env.enable_api_docs

# ── Logging (structured-ish, all apps to console) ──────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {"format": "{levelname} {asctime} {name} {message}", "style": "{"},
    },
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "verbose"}},
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "odds": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "predictions": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}
