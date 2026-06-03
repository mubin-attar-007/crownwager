# Security

## ⚠️ Rotate the legacy secrets

The legacy `config/dev/.env` and `config/prod/.env` (now under `_archived/`) contained **real
credentials committed to source control**: a Gmail app password, database credentials, a The Odds API
key, Reddit OAuth tokens, and the Django `SECRET_KEY`. **Treat all of these as compromised and rotate
them.** None are reused by the new platform.

## What the rebuild fixes

| Legacy issue | Fix |
|---|---|
| Secrets in git | `.env` is gitignored; only `.env.example` is committed; `pydantic-settings` reads env vars. Prod refuses to boot with the default `SECRET_KEY`. |
| `profile_view` 500 for anon users | `/auth/me/` requires auth and returns a clean **401**. |
| No `SECURE_*` headers in prod | `prod.py` sets SSL redirect, HSTS (1y, preload), secure + httponly cookies, nosniff, `X-Frame-Options: DENY`. |
| No auth on the API | JWT (SimpleJWT) Bearer auth; DRF throttling (anon 60/min, user 240/min). |
| Open redirect via bookmaker dict | Bookmakers are DB rows (admin-managed), not an arbitrary redirect target. |
| `DEBUG`-only static serving | WhiteNoise serves compressed, hashed static in all environments. |

## Operational guidance

- Generate a strong `SECRET_KEY` for every environment; never commit it.
- Put the platform behind TLS in production (the `SECURE_*` settings assume HTTPS at the edge).
- Run `bandit` (backend) and `pip-audit` / `npm audit` in CI (wired in `.github/workflows/ci.yml`).
- This is an **informational** product: it stores no payment data and executes no wagers, which keeps
  PCI/KYC/AML out of scope. If that ever changes, a full compliance review is required first.
