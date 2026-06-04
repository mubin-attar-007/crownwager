# Deployment

## Local (Docker)

```bash
cp infrastructure/.env.example infrastructure/.env   # fill in keys (or leave blank for demo mode)
docker compose -f infrastructure/docker-compose.yml up --build
```
Frontend → http://localhost:3000 · API → http://localhost:8000 · AI → http://localhost:8001.

---

## Public deployment on a 100% FREE stack (no purchase, no card)

| Piece | Host | Free tier |
|---|---|---|
| Frontend (Next.js) | **Vercel** | generous, always-on |
| Backend (Django) + AI (FastAPI) | **Render** | free web services (sleep after 15 min idle) |
| PostgreSQL | **Neon** | free, always-on |
| Redis | **Upstash** | free, serverless |

> Free-tier caveats: Render web services **sleep on idle** (first request after sleep takes ~30–50s) and
> free Render does **not** run always-on background workers, so the scheduled data refresh (Celery beat)
> isn't available — refresh runs on deploy + can be triggered on a schedule (see step 6).

### 0. Rotate the shared keys first
The Odds API key and Google Gemini key shared during development must be **rotated** (regenerate them in
[the-odds-api.com](https://the-odds-api.com) and [Google AI Studio](https://aistudio.google.com/apikey))
before going public. They only ever live in env vars / dashboards — never in git.

### 1. Database — Neon (Postgres)
1. Sign up at [neon.tech](https://neon.tech) (GitHub login, no card).
2. Create a project → copy the **connection string** (looks like `postgresql://user:pass@host/db?sslmode=require`).
   This is your `DATABASE_URL`.

### 2. Redis — Upstash
1. Sign up at [upstash.com](https://upstash.com).
2. Create a Redis database → copy the **`rediss://...` URL**. This is your `REDIS_URL`.

### 3. Backend + AI — Render (via the blueprint)
1. Push this repo to GitHub.
2. At [render.com](https://render.com) → **New → Blueprint** → pick your repo. Render reads `render.yaml`
   and creates **crownwager-backend** + **crownwager-ai**.
3. In the **crownwager-backend** service → Environment, set the `sync:false` vars:
   - `DATABASE_URL` = Neon string
   - `REDIS_URL` = Upstash string
   - `ODDS_API_KEY` = your (rotated) Odds API key
   - `LLM_API_KEY` = your (rotated) Gemini key
   - `ALLOWED_HOSTS` = `crownwager-backend.onrender.com` (your backend domain)
   - `CORS_ALLOWED_ORIGINS` = your Vercel URL (set after step 4, e.g. `https://crownwager.vercel.app`)
   - `ADMIN_URL` = a hard-to-guess path, e.g. `ops-7f3a9c/`
4. Deploy. The backend runs migrations + collectstatic on boot. Check `…onrender.com/api/health/`.

### 4. Frontend — Vercel
1. At [vercel.com](https://vercel.com) → **New Project** → import the repo → set **Root Directory** to
   `frontend`.
2. Add env var `NEXT_PUBLIC_API_BASE_URL` = `https://crownwager-backend.onrender.com/api`.
3. Deploy → you get `https://<project>.vercel.app`. Put that into the backend's `CORS_ALLOWED_ORIGINS`
   (and `ALLOWED_HOSTS` if you add a custom domain), then redeploy the backend.

### 5. First-run setup
From the Render backend **Shell** (or a one-off job):
```bash
python manage.py createsuperuser     # your admin login
python manage.py seed_demo           # bookmakers + Betting-101 guides
python manage.py refresh_predictions # pull live odds → model → best bets
python manage.py fetch_news          # pull ESPN headlines
```
Admin is at `…onrender.com/<ADMIN_URL>` (the value you set).

### 6. Scheduled refresh (free, optional)
Free Render has no always-on worker, so schedule the refresh with a **free GitHub Actions cron** that runs
`refresh_predictions` + `fetch_news` (e.g. every few hours) against the deployed backend, or trigger Render's
deploy hook on a schedule. A sample workflow can be added under `.github/workflows/`.

---

## Production safety (enforced by `settings/prod.py`)
With `DJANGO_ENV=prod` the app **refuses to start** if `SECRET_KEY` is the dev default, if `ALLOWED_HOSTS`
contains `*`, or if `CORS_ALLOWED_ORIGINS` contains `localhost`/`*` — so an insecure config can't reach
production. It also forces HTTPS redirect, HSTS, secure + strict-same-site cookies, and JSON-only responses.

## Intentionally deferred (future hardening)
Kubernetes/Terraform IaC, Sentry/Prometheus observability, an always-on Celery worker (needs a paid host),
a paid Odds API tier for high traffic, and a CDN. The architecture (decoupled services, env-driven config)
accepts these without rework.
