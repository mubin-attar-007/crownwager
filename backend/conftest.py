"""Shared pytest fixtures.

Clear the cache around every test so DRF's rate-limit counters (which live in the cache and would
otherwise accumulate across a run now that credential endpoints are scoped-throttled) don't leak
between tests.
"""
from __future__ import annotations

import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def _clear_cache_between_tests():
    cache.clear()
    yield
    cache.clear()
