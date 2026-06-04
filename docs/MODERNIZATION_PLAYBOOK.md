# Legacy → Modern Web App: Modernization Playbook

A repeatable recipe for turning an old/legacy codebase into a modern, tested, deployed web app.
This is the exact process, stack, tooling, and gotchas used to rebuild **CrownWager** (a legacy Django
monolith that scored **2.3/10** in audit) into a live, ML-backed, production-hardened product deployed
free on Hugging Face + Vercel + Neon + Upstash. Copy this into any project you want to modernize.

> Core principle: **Assess honestly → archive the old → rebuild modern from a clean foundation →
> migrate only the genuinely valuable domain logic → verify every phase → harden → deploy.**
> Do **not** try to "rescue" code that's below standard; preserve ideas/algorithms/data, not structure.

---

## 0. Philosophy & decision rules

1. **Measure before you touch.** Audit the legacy app across many dimensions and score it. Let the
   score (not sentiment) decide preserve-vs-rebuild.
2. **Classify every module** as one of: **Reuse as-is · Refactor & improve · Rewrite · Archive.**
3. **Archive, don't delete.** Move the whole legacy tree into `_archived/` (kept out of git history)
   so nothing is lost, then build fresh alongside it. Delete the archive only once value is extracted.
4. **Migrate ideas, not code.** Carry forward algorithms, datasets, domain rules, and design language —
   not the old architecture, file layout, or framework choices, unless demonstrably good.
5. **Verify continuously.** After every phase, run the tests/build in a container. Never accumulate
   unverified work.
6. **Config from the environment** (12-factor). No secrets in git, ever.
7. **Degrade gracefully.** Every external dependency (paid API, AI service, third-party feed) needs a
   fallback so the app always runs (demo/sample data, baseline model, cached response).

---

## 1. The process (phases)

Each phase has a **deliverable** and a **verification gate**. Don't move on until the gate is green.

| Phase | What you do | Gate |
|---|---|---|
| **0. Assess** | Multi-dimension audit of the legacy app; score it; classify modules; decide rebuild scope | A written assessment + module classification |
| **1. Archive & scaffold** | Move legacy → `_archived/`; create the new pro folder structure | Clean tree: `backend/ frontend/ ai/ infrastructure/ docs/` |
| **2. Foundation** | New project skeleton, typed config, Docker, CI, health endpoint | `docker compose up` boots; `/health` 200 |
| **3. Core domain (backend)** | Rebuild the valuable features as clean services + APIs; port key algorithms | Backend tests pass; endpoints serve |
| **4. AI/ML service** | If ML is involved: a separate service; train + **honestly validate** the model | Backtest/CV metrics; service `/predict` works |
| **5. Frontend** | Modern SPA consuming the API; design system; pages | `tsc` + build + lint green; pages render |
| **6. Make it live** | Wire real data via free APIs/feeds; graceful demo fallback | Endpoints return `source: live` |
| **7. Rebrand (optional)** | Pick a name; mechanical find-replace across the repo | Build green; zero old-brand tokens |
| **8. Harden for prod** | Security/perf/SEO/a11y/compliance audit + fixes | All quality gates + prod-config guards |
| **9. Deploy** | Push to free hosting; connect services; verify end-to-end | Live URL serves real data |

---

## 2. The tech stack (the template)

This is the default stack — swap pieces to fit the project, but it's a strong, modern, free-tier-friendly baseline.

### Backend (API)
- **Django 5.1 + Django REST Framework** — batteries-included (admin, ORM, auth, migrations). Pick this
  over FastAPI when you want a real admin + auth + ORM fast. (Use FastAPI when it's a thin ML/async API.)
- **djangorestframework-simplejwt** — JWT auth (short access token + rotating, blacklisted refresh).
- **drf-spectacular** — OpenAPI/Swagger docs.
- **pydantic-settings** — typed, validated env config (replaces scattered `os.getenv`).
- **dj-database-url** + **psycopg[binary]** — Postgres via a single `DATABASE_URL`.
- **Celery + Redis** — async jobs + caching + (optional) scheduled tasks via Celery Beat.
- **WhiteNoise** + **gunicorn** — static serving + WSGI server for prod.
- **django-cors-headers**, **django-filter**.

### AI / ML service (only if needed)
- **FastAPI + uvicorn** — fast, async, typed; ideal for a model-serving microservice.
- **XGBoost / scikit-learn / numpy / pandas** — modeling.
- A **model registry + manifest** (versions, checksums, validated metrics) so models aren't opaque.

### Frontend
- **Next.js 15 (App Router) + React 19 + TypeScript** — SSR/SSG, file-based routing, great DX.
- **Tailwind CSS** + a small design-token system; `next/font` for typography.
- A tiny typed API client (`fetch` wrapper) + an auth context; per-feature pages.

### Infrastructure & quality
- **Docker** (multi-stage, non-root, slim base) + **docker-compose** (one-command local stack).
- **GitHub Actions** CI (lint + type-check + tests + build on every push).
- Backend gates: **ruff** (lint), **black** (format), **mypy** (types), **pytest** + **pytest-django** +
  **factory-boy** + **responses** (tests/mocks), **bandit** + **pip-audit** (security).
- Frontend gates: **eslint** (next), **tsc** (`--noEmit`), **vitest** (unit), production **next build**.
- **pre-commit** hooks; **.editorconfig**; **LICENSE** (MIT for OSS, or proprietary "all rights reserved").

### External data / AI (free tiers)
- Domain data via a free API (e.g. The Odds API) + free feeds (e.g. ESPN RSS).
- LLM features via an **OpenAI-compatible** client so you can use **Gemini (free)**, Groq, Ollama, or
  Anthropic interchangeably by changing `base_url` + `model`.

### Free deployment (no credit card)
- **Hugging Face Spaces** (Docker) — backend (+ AI) container, free, no card.
- **Vercel** — Next.js frontend, free.
- **Neon** — Postgres, free, no card.
- **Upstash** — Redis, free, no card.
- *(Alternative if a card is acceptable: Render Blueprint via `render.yaml`.)*

---

## 3. Architecture patterns to apply

- **Layering:** thin views/serializers (HTTP adapters) → **service layer** (`*/services/`, framework-free,
  unit-testable) → **repositories**/ORM. Business logic never lives in views.
- **API-first:** backend is a pure JSON API; frontend is a separate SPA. Enables web + mobile + CLI later.
- **Decoupled ML:** the model runs in its own service/process, called over HTTP, with a baseline fallback —
  so the heavy ML stack never blocks web requests and the app survives the model being down.
- **`Decimal` for money** (never float) in any odds/EV/stake/financial math.
- **Graceful degradation everywhere:** `live data → cached → demo/sample`. Add a `demo`/`source` flag to
  responses so the UI can label it.
- **Normalized DB schema** (not one wide table). Index foreign keys (Django does this automatically).
- **Env-driven config + fail-fast prod guards:** the app refuses to boot in prod if `SECRET_KEY` is the
  dev default, `ALLOWED_HOSTS` has `*`, or `CORS_ALLOWED_ORIGINS` contains `localhost`/`*`.

---

## 4. Quality gates (run after every change)

```bash
# Backend (in the backend container, source mounted)
ruff check .            # lint
mypy .                  # types
bandit -ll -r .         # security
pytest -q               # tests

# Frontend
npx tsc --noEmit        # types
npx next lint           # lint
npm run build           # production build
npm test                # vitest

# Full stack
docker compose -f infrastructure/docker-compose.yml up --build   # one-command e2e
```

**Verify in Docker, not just locally.** Bleeding-edge local interpreters (e.g. Python 3.14) often lack
wheels for ML/C-extension deps — pin a stable base image (Python 3.12) in Docker and treat that as truth.

---

## 5. The modernization checklist (copy/paste per project)

**Assess**
- [ ] Audit across: architecture, code quality, maintainability, scalability, security, testability,
      tech choices, folder structure, technical debt, dependency health, UI/UX, deployment readiness.
- [ ] Score each dimension; write a 1-paragraph verdict; classify every module (Reuse/Refactor/Rewrite/Archive).
- [ ] List the genuinely valuable assets to migrate (algorithms, datasets, domain rules, design language).

**Rebuild**
- [ ] Move legacy → `_archived/` (gitignored); create `backend/ frontend/ ai/ infrastructure/ docs/`.
- [ ] `git init`; `.gitignore` excludes `.env`, `_archived/`, `node_modules`, build artifacts, large binaries.
- [ ] Typed env config; Docker + compose; CI; health endpoint. **Gate: boots + /health 200.**
- [ ] Port valuable algorithms into a **service layer** with unit tests (money math in `Decimal`).
- [ ] Rebuild features as clean DRF endpoints with graceful fallbacks. **Gate: tests pass.**
- [ ] (ML) separate service; train + **honestly validate** (fixed hold-out + k-fold CV, **no
      cherry-picking the best random split**); model registry + manifest. **Gate: real metrics.**
- [ ] Modern frontend (Next.js + TS + Tailwind); design tokens; typed API client; auth context. **Gate: build green.**

**Live data**
- [ ] Wire free APIs/feeds; cache aggressively (shared Redis) to respect free quotas; `demo` fallback.

**Harden for public launch (P0s)**
- [ ] Secrets only in env (never committed); rotate anything ever exposed.
- [ ] JWT lifetimes + refresh rotation/blacklist; throttle expensive/LLM endpoints.
- [ ] Lock CORS to the real domain; `SECURE_*`/HSTS/secure-cookies; CSP + security headers.
- [ ] Validate/allowlist user input (e.g. path params); sanitize any stored HTML (XSS).
- [ ] Legal: Terms + Privacy pages, 18+/age gate if relevant, responsible-use disclaimers.
- [ ] SEO: per-page metadata/OG, `sitemap`, `robots`, favicon/manifest; mark private routes `noindex`.
- [ ] a11y: semantic HTML, ARIA on widgets, keyboard focus, contrast; remove fake/dead UI affordances.
- [ ] Prod Docker: non-root user, env-driven workers; prod-config fail-fast guards.

**Deploy**
- [ ] Push to GitHub (private); deploy via the free recipe (§6); set secrets in the host dashboard.
- [ ] Connect frontend↔backend (`NEXT_PUBLIC_API_BASE_URL`, `CORS_ALLOWED_ORIGINS`); verify e2e.

---

## 6. Free deployment recipe (no credit card)

1. **Postgres → Neon** ([neon.tech](https://neon.tech)): create project → copy `DATABASE_URL`
   (`postgresql://…?sslmode=require`).
2. **Redis → Upstash** ([upstash.com](https://upstash.com)): create Redis → copy the **`rediss://`** URL
   (TLS — change `redis://` to `rediss://` if shown without the `s`).
3. **Backend (+AI) → Hugging Face Space** (Docker): the repo has a **root `Dockerfile`** + a `README.md`
   with HF frontmatter (`sdk: docker`, `app_port: 7860` — must be the **first lines** of the file). Create a
   Docker Space, then push the repo to it: `git remote add space <space-git-url> && git push space main`
   (auth: HF username + a **write** token). Set all backend secrets in **Space → Settings → Variables and
   secrets**. The container runs Django on `7860` and the AI service internally on `8001`.
4. **Frontend → Vercel** ([vercel.com](https://vercel.com)): import the GitHub repo, **Root Directory =
   `frontend`**, env `NEXT_PUBLIC_API_BASE_URL = https://<hf-space-url>/api`, deploy.
5. **Connect:** set the backend's `CORS_ALLOWED_ORIGINS` = the exact Vercel URL (no trailing slash) →
   restart the Space.
6. **Keep data fresh** (free hosts have no always-on worker): a token-guarded `/api/internal/refresh/`
   endpoint + a scheduled **GitHub Action** that POSTs to it on a cron.

See `docs/HUGGINGFACE.md` and `docs/DEPLOYMENT.md` for the exact click-by-click.

---

## 7. Gotchas & lessons (things that bit us — pre-empt them)

- **Bleeding-edge Python locally** (3.14) → no wheels for TensorFlow/XGBoost/psycopg/Pillow. **Fix:** do all
  builds/tests in **Docker on Python 3.12**; treat Docker as the source of truth.
- **HF Space "missing yaml metadata":** the README YAML frontmatter must be the **very first lines** (no
  comment/blank line above the opening `---`).
- **HF Docker port:** HF routes to `app_port` (default 7860). Bind your server to it.
- **Prod won't boot:** the fail-fast guards intentionally crash if `SECRET_KEY`/`ALLOWED_HOSTS`/
  `CORS_ALLOWED_ORIGINS` are unset/insecure — the container logs tell you exactly which. Set the secrets.
- **CORS must match exactly:** `CORS_ALLOWED_ORIGINS` = the precise frontend origin, **no trailing slash**.
- **`rediss://` not `redis://`** for Upstash (TLS).
- **Free Odds/data quotas:** cache responses in shared Redis with long TTLs; show a "sample data" badge on
  fallback. Don't expect a free 500-req/month tier to survive public traffic.
- **Hardcoded seed admin** is a security hole in prod — create the admin from env secrets
  (`DJANGO_SUPERUSER_EMAIL`/`PASSWORD`), never a known password.
- **Honest ML metrics:** the legacy "68%" was the best of 300 random splits (overfit). Always report a
  fixed hold-out + k-fold CV — the real number was 65%.
- **Git ownership / line endings on Windows:** `git config --global --add safe.directory <path>` for the
  dubious-ownership error; LF↔CRLF warnings are harmless.
- **Compose project name** = container names; renaming it orphans old containers (down the old project first).

---

## 8. The force-multiplier: AI-assisted multi-agent audits

The single biggest accelerator was running **parallel specialist agents** at two points:
- **Assessment:** ~6 module-mappers + 9 dimension-reviewers + a synthesizer → a scored audit and a
  module-by-module Reuse/Refactor/Rewrite/Archive plan.
- **Launch readiness:** 8 reviewers (security, performance, UX, a11y, SEO, deploy, correctness, compliance)
  + a synthesizer → a prioritized **P0/P1/P2** punch-list.

Pattern: **fan out specialists in parallel → each returns structured findings with file paths + concrete
fixes → a synthesizer dedupes and prioritizes → you execute in priority order, verifying each fix.** This
turns a vague "modernize it" into a concrete, ordered, evidence-backed work list.

---

### TL;DR
Assess and score → archive legacy → clean pro structure → typed config + Docker + CI → rebuild features as
tested services behind a DRF API → decoupled, honestly-validated ML → modern Next.js frontend → live data
with graceful fallbacks → security/SEO/a11y/legal hardening → deploy free on HF + Vercel + Neon + Upstash →
verify the live URL serves real data. Migrate ideas, not code. Verify every phase. Never commit a secret.
