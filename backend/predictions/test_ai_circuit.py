"""Tests for the AI-service circuit breaker (fail-fast when the AI service is down)."""
from __future__ import annotations

import pytest

import predictions.services.ai_client as ai
from predictions.services.ai_client import AIServiceClient, AIServiceError, _CircuitBreaker


def test_circuit_breaker_opens_then_recovers(monkeypatch) -> None:
    clock = {"t": 1000.0}
    monkeypatch.setattr(ai.time, "monotonic", lambda: clock["t"])

    cb = _CircuitBreaker(failure_threshold=2, recovery_timeout=30.0)
    assert cb.allow() is True
    cb.record_failure()
    assert cb.allow() is True  # 1 failure < threshold
    cb.record_failure()  # 2 failures -> open
    assert cb.allow() is False  # within cooldown -> fail fast
    clock["t"] += 31  # cooldown elapsed
    assert cb.allow() is True  # half-open probe allowed
    cb.record_success()
    assert cb.allow() is True  # closed again


def test_predict_fails_fast_when_circuit_open(monkeypatch) -> None:
    # Force an already-open breaker; predict() must NOT make an HTTP call.
    open_cb = _CircuitBreaker(failure_threshold=1, recovery_timeout=999.0)
    open_cb.record_failure()  # -> open
    monkeypatch.setattr(ai, "_breaker", open_cb)

    def _should_not_call(*args, **kwargs):  # pragma: no cover - asserts it's never reached
        raise AssertionError("HTTP must not be called while the circuit is open")

    monkeypatch.setattr(ai.requests, "post", _should_not_call)

    with pytest.raises(AIServiceError):
        AIServiceClient(base_url="http://ai.invalid").predict([{"id": 1}])
