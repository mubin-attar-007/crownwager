"""Type-safe environment configuration via pydantic-settings.

All runtime configuration flows through the single ``env`` object below. This replaces the
legacy pattern of scattered ``os.getenv`` calls and keeps validation in one place. Values are
read from process environment variables first, then from a local ``.env`` file (dev only).
"""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ── Core Django ────────────────────────────────────────────────
    django_env: str = "dev"
    secret_key: str = "dev-insecure-secret-key-change-me"
    debug: bool = False
    allowed_hosts: str = "localhost,127.0.0.1,backend"
    # Admin path (set to a hard-to-guess value in production, e.g. "ops-7f3a/").
    admin_url: str = "admin/"
    # Expose the OpenAPI docs (Swagger/Redoc). Keep false in production.
    enable_api_docs: bool = False

    # ── Database / cache / broker ──────────────────────────────────
    # Defaults to SQLite + in-process cache so the API boots with zero external services
    # in local dev. docker-compose injects a Postgres DATABASE_URL and CACHE_BACKEND=redis.
    database_url: str = "sqlite:///db.sqlite3"
    redis_url: str = "redis://localhost:6379/0"
    cache_backend: str = "locmem"  # "locmem" | "redis"

    # ── CORS (frontend origin) ─────────────────────────────────────
    cors_allowed_origins: str = "http://localhost:3000"

    # ── External services ──────────────────────────────────────────
    odds_api_key: str = ""
    odds_api_base_url: str = "https://api.the-odds-api.com/v4"
    ai_service_url: str = "http://localhost:8001"
    # Shared secret for the scheduled-refresh endpoint (blank = endpoint disabled).
    refresh_token: str = ""

    # ── Email (optional) ───────────────────────────────────────────
    email_host: str = "smtp.gmail.com"
    email_port: int = 587
    email_host_user: str = ""
    email_host_password: str = ""

    # ── Optional AI assistant (CrownBot) ────────────────────────────
    # Either set ANTHROPIC_API_KEY, OR set the LLM_* vars for any OpenAI-compatible provider
    # (Groq, Google Gemini, OpenRouter, Ollama, OpenAI). If neither is set, CrownBot uses its
    # offline rule-based fallback.
    anthropic_api_key: str = ""
    llm_api_key: str = ""
    llm_base_url: str = ""  # e.g. https://api.groq.com/openai/v1
    llm_model: str = ""  # e.g. llama-3.3-70b-versatile

    @property
    def allowed_hosts_list(self) -> list[str]:
        return [h.strip() for h in self.allowed_hosts.split(",") if h.strip()]

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]

    @property
    def is_prod(self) -> bool:
        return self.django_env.lower() in {"prod", "production"}


env = Settings()
