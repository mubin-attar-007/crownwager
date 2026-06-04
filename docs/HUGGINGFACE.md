# Deploy free on Hugging Face Spaces + Vercel (no credit card)

A 100% card-free stack:
- **Backend + AI** → one **Hugging Face Space** (Docker) — the root `Dockerfile` runs Django *and*
  the AI service together (Django on the public port `7860`, AI internally on `8001`).
- **Frontend** → **Vercel** (Next.js).
- **Postgres** → Neon · **Redis** → Upstash (you already created these).

Your backend URL is **predictable** from your HF username + Space name:
`https://<hf-username>-crownwager.hf.space` (e.g. `https://mubin-attar-007-crownwager.hf.space`).

---

## 1. Frontend on Vercel (do this first — it uses the predictable backend URL)
1. [vercel.com](https://vercel.com) → **Sign up with GitHub** (no card).
2. **Add New → Project** → import the **crownwager** repo.
3. **Root Directory = `frontend`**.
4. Add Environment Variables:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://<hf-username>-crownwager.hf.space/api`
   - `NEXT_PUBLIC_SITE_URL` = (leave blank for now; set to your Vercel URL after the first deploy)
5. **Deploy** → you get a URL like `https://crownwager.vercel.app`. **Copy it** — the backend needs it.
6. (Optional) Go back and set `NEXT_PUBLIC_SITE_URL` to that URL and redeploy (for correct SEO/sitemap links).

## 2. Backend + AI on a Hugging Face Space
1. [huggingface.co](https://huggingface.co) → sign up (no card).
2. **New → Space**. Name: **`crownwager`**. **SDK: Docker** (blank template). Hardware: **CPU basic (free)**.
   Visibility: Private or Public (either is fine on free).
3. **Get a write token:** HF → your avatar → **Settings → Access Tokens → New token** → role **Write** → copy it.
4. **Push the code to the Space** (from your project folder):
   ```bash
   git remote add space https://huggingface.co/spaces/<hf-username>/crownwager
   git push space main
   ```
   When git asks: username = your **HF username**, password = the **write token** from step 3.
   (HF reads the root `Dockerfile` + the `README.md` frontmatter to build the Space.)
5. **Set the Space secrets:** Space → **Settings → Variables and secrets → New secret**, add each:

   | Secret | Value |
   |---|---|
   | `SECRET_KEY` | a long random string (e.g. from `openssl rand -hex 32`) |
   | `DATABASE_URL` | your Neon `postgresql://…?sslmode=require` |
   | `REDIS_URL` | your Upstash `rediss://…` |
   | `ODDS_API_KEY` | your rotated Odds API key |
   | `LLM_API_KEY` | your rotated Gemini key |
   | `LLM_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai/` |
   | `LLM_MODEL` | `gemini-2.5-flash` |
   | `ALLOWED_HOSTS` | `<hf-username>-crownwager.hf.space` |
   | `CORS_ALLOWED_ORIGINS` | your Vercel URL, e.g. `https://crownwager.vercel.app` |
   | `ADMIN_URL` | a random path, e.g. `ops-7f3a9c/` |
   | `DJANGO_SUPERUSER_EMAIL` | your email (creates the admin login) |
   | `DJANGO_SUPERUSER_PASSWORD` | a strong password (your admin password) |

   *(The Dockerfile already sets `DJANGO_ENV=prod`, `CACHE_BACKEND=redis`, `AI_SERVICE_URL`,
   `MODEL_DIR`, and `SECURE_SSL_REDIRECT=false` — no need to add those.)*
6. The Space **rebuilds** (~5–10 min). Watch the **Logs** tab. When it's running, open
   `https://<hf-username>-crownwager.hf.space/api/health/` → should return `{"status":"ok"}`.
   On boot it runs migrations, seeds bookmakers/articles, and creates your admin.

## 3. Connect & test
- Open your **Vercel URL** → the app should load with live data (NBA may be quiet off-season — switch the
  sport selector to **MLB**).
- Admin: `https://<hf-username>-crownwager.hf.space/<ADMIN_URL>` with your superuser email/password.
- CrownBot uses your Gemini key. Odds/best-bets use your Odds API key.

## 4. Keep data fresh (optional, free)
HF Spaces sleep when idle. Add two **GitHub repo secrets** (`BACKEND_URL` =
`https://<hf-username>-crownwager.hf.space`, `REFRESH_TOKEN` = a random string also set as an HF secret),
and the `.github/workflows/refresh.yml` Action refreshes predictions + news every 6 h.

## Notes & gotchas
- **First request after idle** is slow (~30–60 s) while the Space wakes — normal on free.
- The backend **fails to start** if `ALLOWED_HOSTS`/`CORS_ALLOWED_ORIGINS` are missing or contain
  `localhost`/`*` (a safety guard). Make sure both are set to your real HF/Vercel domains.
- To update later: `git push origin main` (GitHub, for Vercel) **and** `git push space main` (HF).
