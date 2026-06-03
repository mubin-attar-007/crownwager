"""HTTP client for the standalone AI prediction service (the ``ai/`` FastAPI app).

The backend never imports TensorFlow/XGBoost directly — it asks the AI service for probabilities.
If the AI service is unreachable (e.g. local dev without Docker), callers fall back to demo data so
the product still runs. This keeps the heavy ML stack fully decoupled from the web process.
"""
from __future__ import annotations

import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    pass


class AIServiceClient:
    def __init__(self, base_url: str | None = None, timeout: int = 15) -> None:
        self.base_url = (base_url or settings.AI_SERVICE_URL).rstrip("/")
        self.timeout = timeout

    def health(self) -> bool:
        try:
            resp = requests.get(f"{self.base_url}/health", timeout=5)
            return resp.status_code == 200
        except requests.RequestException:
            return False

    def predict(self, games: list[dict]) -> list[dict]:
        """Ask the AI service to score a list of games. Returns per-game model predictions."""
        try:
            resp = requests.post(
                f"{self.base_url}/predict", json={"games": games}, timeout=self.timeout
            )
            resp.raise_for_status()
            return resp.json().get("predictions", [])
        except requests.RequestException as exc:
            logger.warning("AI service unavailable: %s", exc)
            raise AIServiceError("AI service unavailable.") from exc
