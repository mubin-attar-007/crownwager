# Backup & restore

crownwager's source-of-truth data lives in **Neon Postgres** (Django ORM models). Redis
(Upstash) is a cache + Celery broker — not a source of truth, so it needs no backup.

## Backups
- **Neon point-in-time restore (PITR)** — primary mechanism (WAL retention per plan;
  free ~24h, paid longer). No setup required.
- **Optional logical dumps** for longer retention:
  ```bash
  pg_dump "$DATABASE_URL" -Fc -f "crownwager-$(date -u +%Y%m%d).dump"
  ```

## Monthly restore verification (do not skip)
1. Neon console → **create a branch** from a recent point in time (isolated copy).
2. Point a checkout at it: `export DATABASE_URL="<branch URL>"`.
3. Verify the app boots against it and the data is intact:
   ```bash
   cd backend
   python manage.py check
   python manage.py shell -c "from django.contrib.auth.models import User; print('users:', User.objects.count())"
   ```
4. **Delete the Neon branch.**
5. Record the date + result in the log below.

## Restore-verification log
| Date (UTC) | Result | Notes |
|---|---|---|
| _none yet_ | | |
