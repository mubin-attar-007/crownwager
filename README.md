# OddsAway — Data-Driven Sports Betting Analytics

A modern, full-stack sports-betting **analytics & predictions** platform (inspired by
[dimers.com](https://www.dimers.com)): daily **+EV best bets**, **ML model predictions**, **live
odds comparison**, **scores**, an **arbitrage finder**, **saved picks**, a multi-sport selector,
and **OddsBot** — a Claude-powered assistant grounded in the current best bets.

> ℹ️ **Informational only.** OddsAway does not accept wagers, hold funds, or give financial advice.
> **18+. Please bet responsibly.**

This repository is a ground-up rebuild of a legacy Django monolith that scored **2.3/10** in a
12-dimension assessment (security, scalability, testability, and deployment all rated *Critical*).
The old code is preserved untouched under [`_archived/`](./_archived/README.md); only genuinely
valuable domain logic (the arbitrage algorithm, EV/Kelly math, ML concepts, auth patterns, and the
landing design language) was carried forward.

## Architecture

```
┌────────────┐     REST/JSON      ┌─────────────────┐   HTTP    ┌──────────────┐
│  frontend  │ ─────────────────► │     backend     │ ────────► │  ai service  │
│  Next.js   │ ◄───────────────── │  Django + DRF   │ ◄──────── │   FastAPI    │
│  TS + TW   │     JWT auth       │  Celery + Redis │  predict  │  model reg.  │
└────────────┘                    └────────┬────────┘           └──────────────┘
                                           │
                                    ┌──────▼──────┐
                                    │ PostgreSQL  │
                                    └─────────────┘
```

- **`backend/`** — Django 5.1 + DRF API (auth/JWT, odds, arbitrage, predictions, best-bets, content),
  service + repository layers, Celery + Redis for async jobs and caching. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **`ai/`** — standalone FastAPI prediction service with a model registry, feature engineering, and a
  transparent baseline model (pluggable for the validated NN/XGBoost). See [docs/ML_MODELS.md](docs/ML_MODELS.md).
- **`frontend/`** — Next.js 15 (React 19) + TypeScript + Tailwind dashboard.
- **`infrastructure/`** — Docker, docker-compose, env templates.
- **`docs/`** — architecture, API, ML, security, deployment, responsible-gambling.
- **`_archived/`** — the original legacy project (reference only).

## Quick start (one command)

Requires Docker. From the repo root:

```bash
cp infrastructure/.env.example infrastructure/.env     # already provided for local dev
docker compose -f infrastructure/docker-compose.yml up --build
```

Then open:

| URL | What |
|---|---|
| http://localhost:3000 | Frontend (best bets, predictions, odds, arbitrage, learn) |
| http://localhost:8000/api/docs/ | API docs (Swagger / OpenAPI) |
| http://localhost:8000/admin/ | Django admin — `admin@oddsaway.local` / `admin12345` |
| http://localhost:8001/health | AI service health |

The stack runs in **demo mode** out of the box (no API key needed) using clearly-labelled sample
data. Add a free [The Odds API](https://the-odds-api.com) key to `infrastructure/.env`
(`ODDS_API_KEY=...`) for live odds.

## Local development (without Docker)

The backend runs on SQLite + in-process cache with zero external services:

```bash
cd backend
python -m venv .venv && . .venv/Scripts/activate    # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
python manage.py migrate && python manage.py seed_demo
python manage.py runserver           # http://localhost:8000
pytest                               # run the test suite
```

```bash
cd frontend
npm install
npm run dev                          # http://localhost:3000
```

> Note: the **AI service** requires Python 3.12 (TensorFlow/XGBoost have no 3.14 wheels yet) — run it
> via Docker. The backend gracefully falls back to demo predictions if the AI service is unreachable.

## Tests

| Tier | Command | Coverage |
|---|---|---|
| Backend | `cd backend && pytest` | 35 tests: auth flow, arbitrage (Decimal), EV/Kelly, Odds API client (mocked), AI client, Celery persistence + DB-read, saved picks, OddsBot |
| AI | `pytest ai/tests` | 5 tests: features, engine, `/health`, `/predict` |
| Frontend | `cd frontend && npm test` | format helpers (Vitest) |

Quality gates (all clean, enforced in CI): `ruff` + `mypy` + `bandit` (backend); `eslint` + `tsc` (frontend).

CI runs all three on every push — see [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Status

This is an MVP / college-project-grade rebuild that is **runnable, tested, and containerized**.
Production hardening (managed Postgres/Redis, K8s/IaC, Sentry/observability, model retraining +
validation, secret manager) is intentionally deferred — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
