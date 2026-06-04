#!/usr/bin/env bash
# Startup for the combined Hugging Face Space: AI service (background) + Django (foreground).
set -e

# 1. Start the AI prediction service internally on :8001 (backend calls it via localhost).
cd /app
uvicorn ai.service.app:app --host 0.0.0.0 --port 8001 &

# 2. Prepare + serve the Django backend.
cd /app/backend
python manage.py migrate --noinput
python manage.py seed_demo || true
python manage.py collectstatic --noinput || true

exec gunicorn config_project.wsgi:application \
  --bind "0.0.0.0:${PORT:-7860}" \
  --workers "${WEB_CONCURRENCY:-2}" \
  --timeout 120
