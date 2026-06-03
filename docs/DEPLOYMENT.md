# Deployment

## Local / demo (canonical)

```bash
docker compose -f infrastructure/docker-compose.yml up --build
```

Brings up Postgres, Redis, the Django API (migrates + seeds automatically), Celery worker + beat, the
AI service, and the Next.js frontend. Stop with `docker compose -f infrastructure/docker-compose.yml down`
(add `-v` to also drop the Postgres volume).

## Configuration

All config is environment-driven (`infrastructure/.env`, templated by `.env.example`). Key vars:
`SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`, `CACHE_BACKEND`, `CORS_ALLOWED_ORIGINS`, `ODDS_API_KEY`,
`AI_SERVICE_URL`, `NEXT_PUBLIC_API_BASE_URL`.

## Production notes

For a real deployment, switch `DJANGO_SETTINGS_MODULE=config_project.settings.prod` and provide:
- a strong `SECRET_KEY` and real `ALLOWED_HOSTS`,
- a **managed Postgres** and **managed Redis** (don't self-host the demo containers),
- TLS termination at the edge (the prod settings assume HTTPS),
- a secret manager for credentials (not `.env` files).

The backend image already serves via `gunicorn` and WhiteNoise; the frontend builds a Next.js
standalone server. Run DB migrations on deploy (`python manage.py migrate`).

## Intentionally deferred (future hardening)

To keep this MVP finishable, the following were **scoped out** and noted rather than built: Kubernetes /
Terraform IaC, ELK/Prometheus/Grafana observability, Sentry, pgBouncer, multi-tenancy, DVC/MLflow for
ML lifecycle, and blue-green/canary release automation. The architecture (decoupled services,
containerized, env-driven config) is designed to accept these without rework.

## CI

`.github/workflows/ci.yml` runs three jobs on every push/PR: backend (ruff + bandit + pytest), AI
(pytest), and frontend (vitest + production build).
