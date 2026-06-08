"""HTTP client for the standalone AI prediction service (the ``ai/`` FastAPI app).

The backend never imports TensorFlow/XGBoost directly — it asks the AI service for probabilities.
If the AI service is unreachable (e.g. local dev without Docker), callers fall back to demo data so
the product still runs. A small circuit breaker fails fast when the service is repeatedly down, so a
slow/unreachable AI service can't tie up web workers waiting on the timeout under load.
"""
from __future__ import annotations

import logging
import threading
import time

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    pass


class _CircuitBreaker:
    """Minimal thread-safe circuit breaker: fail fast after repeated failures, probe after a cooldown."""

    def __init__(self, failure_threshold: int = 3, recovery_timeout: float = 30.0) -> None:
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self._failures = 0
        self._opened_at = 0.0
        self._lock = threading.Lock()

    def allow(self) -> bool:
        """True if a call may proceed (closed, or half-open once the cooldown elapses)."""
        with self._lock:
            if self._failures < self.failure_threshold:
                return True
            return (time.monotonic() - self._opened_at) >= self.recovery_timeout

    def record_success(self) -> None:
        with self._lock:
            self._failures = 0
            self._opened_at = 0.0

    def record_failure(self) -> None:
        with self._lock:
            self._failures += 1
            if self._failures >= self.failure_threshold:
                self._opened_at = time.monotonic()


# One breaker per web process, shared across AIServiceClient instances.
_breaker = _CircuitBreaker()


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
        """Ask the AI service to score games. Fails fast (circuit open) when it's repeatedly down."""
        if not _breaker.allow():
            logger.warning("AI service circuit open; failing fast to demo fallback.")
            raise AIServiceError("AI service circuit open (failing fast).")
        try:
            resp = requests.post(
                f"{self.base_url}/predict", json={"games": games}, timeout=self.timeout
            )
            resp.raise_for_status()
            _breaker.record_success()
            return resp.json().get("predictions", [])
        except requests.RequestException as exc:
            _breaker.record_failure()
            logger.warning("AI service unavailable: %s", exc)
            raise AIServiceError("AI service unavailable.") from exc
