# Architecture

## Why a rebuild (assessment summary)

A 17-agent assessment of the legacy `oddsaway` Django monolith scored it **2.3/10** and recommended a
**full rebuild**. Headline issues: secrets committed to the repo, a profile view that 500'd for
anonymous users, no `SECURE_*` headers, heavy ML training/inference inside the web process, a dead
`nfl_betting` app, ~1.1 GB of bloat checked in (venv + a 498 MB `.rar`), a UTF-16 `requirements.txt`
mixing Django + Flask + TensorFlow, no tests, and no deployment story. The full breakdown and
per-module classification live in the saved plan and in [`_archived/README.md`](../_archived/README.md).

## Principles of the new design

1. **API-first, decoupled tiers.** A Django+DRF backend exposes a REST API consumed by a Next.js SPA;
   the ML stack is a separate FastAPI service. Each tier scales and deploys independently.
2. **Business logic out of views.** Domain logic lives in `services/` (Django-free, unit-testable) and
   data access in `repositories/`. Views/serializers are thin HTTP adapters.
3. **Decimal money math.** All odds/EV/stake calculations use `Decimal` (the legacy used floats).
4. **Graceful degradation.** Every external dependency (Odds API, AI service) has a demo/fallback path
   so the product always runs — critical for a demo and for resilience.
5. **Config & secrets via env only.** `pydantic-settings` validates typed config; nothing secret is
   committed; prod enforces a real `SECRET_KEY` and `SECURE_*` headers.

## Backend (`backend/`)

| App | Responsibility |
|---|---|
| `common` | Health endpoint, pagination, the `seed_demo` command. |
| `accounts` | JWT auth (register/login/refresh), `Profile` (bankroll + Kelly settings), signals. |
| `odds` | The Odds API client (`services/odds_api.py`), arbitrage engine (`services/arbitrage.py`), `Bookmaker` model, odds/scores/arbitrage endpoints. |
| `predictions` | Normalized schema (`Game`/`ModelPrediction`/`BestBet`), EV/Kelly staking (`services/staking.py`), best-bets ranking (`services/best_bets.py`), AI-service client, predictions + best-bets endpoints. |
| `content` | Admin-managed news/Betting-101 articles. |

Key flows:
- **Arbitrage:** `OddsAPIClient.fetch_odds` → `find_arbitrage` (best price per outcome, `Σ 1/odds < 1`,
  proportional stakes) → JSON. Pure, tested, `Decimal`.
- **Best bets:** AI service returns per-game model probabilities → `compute_best_bets` compares each to
  the offered odds → edge/EV/Kelly → ranked, with a per-user recommended stake from the profile bankroll.

## AI service (`ai/`)

A FastAPI app (`service/app.py`) exposing `GET /health` and `POST /predict`. A `model_registry` reads
`models/model_manifest.yaml` and only serves a model marked `validated: true` with a matching SHA-256;
otherwise it falls back to a transparent baseline (home-court + ratings + rest, via a logistic
function). `train/` holds reference training + a backtest harness that gates model promotion. This
fixes the legacy gap of opaque, unvalidated binaries.

## Frontend (`frontend/`)

Next.js 15 App Router + TypeScript + Tailwind. A small typed client (`lib/api.ts`) attaches the JWT;
`lib/auth.tsx` provides auth context; pages for best-bets, predictions, odds, scores, arbitrage,
learn, auth, and profile. Design tokens (deep-navy + accent) carry forward the legacy landing look.

## Async & caching

Celery + Redis are wired for background jobs (e.g. scheduled odds refresh / nightly prediction
generation via Celery Beat) and response caching (odds ~5 min, scores ~1 min). Local dev uses an
in-process cache and SQLite so the API boots with no external services.
