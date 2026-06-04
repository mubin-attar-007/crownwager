# Hugging Face Space (Docker SDK) — runs the CrownWager backend (Django) and AI service
# (FastAPI) together in ONE container. HF routes external HTTPS to app_port 7860 (see README
# frontmatter); the AI service runs internally on 8001 and the backend calls it via localhost.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app \
    PORT=7860 \
    MODEL_DIR=/app/ai/models \
    AI_SERVICE_URL=http://localhost:8001 \
    DJANGO_SETTINGS_MODULE=config_project.settings.prod \
    DJANGO_ENV=prod \
    CACHE_BACKEND=redis \
    SECURE_SSL_REDIRECT=false

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev libgomp1 curl \
    && rm -rf /var/lib/apt/lists/*

# Install both dependency sets (Django backend + FastAPI/XGBoost AI).
COPY backend/requirements.txt /tmp/backend-req.txt
COPY ai/requirements.txt /tmp/ai-req.txt
RUN pip install -r /tmp/backend-req.txt -r /tmp/ai-req.txt

# App code (model files under ai/models are included).
COPY backend/ /app/backend/
COPY ai/ /app/ai/
COPY deploy/hf/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Non-root user (HF runs as uid 1000 by default; make /app writable).
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 7860
CMD ["/app/start.sh"]
