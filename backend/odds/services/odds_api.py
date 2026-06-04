"""Client for The Odds API v4.

Ported from the legacy ``betting_bot/main.py`` OddsAPI class. Improvements over the legacy version:
- request timeouts (legacy had none → could hang a web worker indefinitely),
- ``logging`` instead of ``print`` debug spew,
- typed methods returning parsed JSON,
- short-TTL caching via the Django cache to respect the API's request quota.
"""
from __future__ import annotations

import logging
from typing import Any

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 10  # seconds
# Longer TTLs conserve The Odds API free-tier quota (~500 req/month). The Redis cache is shared
# across all users, so one upstream call serves everyone for the TTL window.
ODDS_CACHE_TTL = 900  # 15 minutes
SCORES_CACHE_TTL = 300  # 5 minutes


class OddsAPIError(Exception):
    """Raised when The Odds API call fails or no API key is configured."""


class OddsAPIClient:
    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout: int = DEFAULT_TIMEOUT,
        session: requests.Session | None = None,
    ) -> None:
        self.api_key = api_key if api_key is not None else settings.ODDS_API_KEY
        self.base_url = (base_url or settings.ODDS_API_BASE_URL).rstrip("/")
        self.timeout = timeout
        self.session = session or requests.Session()

    # ── internal ───────────────────────────────────────────────────
    def _get(self, path: str, params: dict[str, Any]) -> Any:
        if not self.api_key:
            raise OddsAPIError("ODDS_API_KEY is not configured.")
        params = {**params, "apiKey": self.api_key}
        url = f"{self.base_url}/{path.lstrip('/')}"
        try:
            resp = self.session.get(url, params=params, timeout=self.timeout)
            resp.raise_for_status()
            return resp.json()
        except requests.HTTPError as exc:
            code = exc.response.status_code if exc.response is not None else "?"
            logger.warning("Odds API HTTP %s for %s", code, path)
            raise OddsAPIError(f"Odds API returned HTTP {code}.") from exc
        except requests.RequestException as exc:
            logger.warning("Odds API request failed for %s: %s", path, exc)
            raise OddsAPIError("Odds API request failed.") from exc

    # ── public ─────────────────────────────────────────────────────
    def fetch_sports(self, all_sports: bool = False) -> list[dict]:
        return self._get("sports/", {"all": str(all_sports).lower()})

    def fetch_odds(
        self,
        sport: str,
        regions: str = "us",
        markets: str = "h2h",
        odds_format: str = "decimal",
        bookmakers: str | None = None,
        use_cache: bool = True,
    ) -> list[dict]:
        cache_key = f"odds:{sport}:{regions}:{markets}:{odds_format}:{bookmakers}"
        if use_cache and (cached := cache.get(cache_key)) is not None:
            return cached
        params: dict[str, Any] = {
            "regions": regions,
            "markets": markets,
            "oddsFormat": odds_format,
        }
        if bookmakers:
            params["bookmakers"] = bookmakers
        data = self._get(f"sports/{sport}/odds/", params)
        if use_cache:
            cache.set(cache_key, data, ODDS_CACHE_TTL)
        return data

    def fetch_scores(self, sport: str, days_from: int = 3, use_cache: bool = True) -> list[dict]:
        cache_key = f"scores:{sport}:{days_from}"
        if use_cache and (cached := cache.get(cache_key)) is not None:
            return cached
        data = self._get(f"sports/{sport}/scores/", {"daysFrom": days_from})
        if use_cache:
            cache.set(cache_key, data, SCORES_CACHE_TTL)
        return data

    def fetch_events(self, sport: str) -> list[dict]:
        return self._get(f"sports/{sport}/events/", {})
