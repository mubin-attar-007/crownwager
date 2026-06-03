# API Reference

Base URL: `http://localhost:8000/api`. Interactive docs at `/api/docs/` (Swagger) and `/api/redoc/`.
Auth uses JWT Bearer tokens. Read endpoints are public; writing to your profile requires auth.

## Auth

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/register/` | `{email, first_name, last_name, password}` | `{user, access, refresh}` |
| POST | `/auth/login/` | `{username: <email>, password}` | `{access, refresh}` |
| POST | `/auth/refresh/` | `{refresh}` | `{access}` |
| GET/PATCH | `/auth/me/` | (PATCH) `{first_name?, last_name?, profile:{bankroll?, kelly_fraction?, favorite_sport?}}` | current user + profile |

`/auth/me/` returns **401** (not 500) when unauthenticated — a fixed legacy bug.

## Odds & arbitrage

| Method | Path | Query | Notes |
|---|---|---|---|
| GET | `/odds/` | `sport`, `markets` | Live odds; `demo:true` if no API key. |
| GET | `/scores/` | `sport`, `days_from` | Recent/live scores. |
| GET | `/arbitrage/` | `sport`, `bet_size` | Arbitrage opportunities with `Decimal` stakes. |
| GET | `/bookmakers/` | — | Bookmaker directory (admin-managed). |

Example:

```bash
curl "http://localhost:8000/api/arbitrage/?sport=basketball_nba&bet_size=200"
```

```json
{
  "sport": "basketball_nba", "bet_size": "200", "demo": true, "count": 1,
  "opportunities": [{
    "home_team": "Los Angeles Lakers", "away_team": "Boston Celtics",
    "implied_total": "0.9524", "profit": "10.00", "profit_pct": "5.00",
    "legs": [
      {"outcome": "Los Angeles Lakers", "bookmaker": "DraftKings", "price": "2.1", "stake": "100.00"},
      {"outcome": "Boston Celtics", "bookmaker": "FanDuel", "price": "2.1", "stake": "100.00"}
    ]
  }]
}
```

## Predictions & best bets

| Method | Path | Query | Notes |
|---|---|---|---|
| GET | `/predictions/` | `sport` | Per-game model probabilities (NN/XGBoost/ensemble). |
| GET | `/best-bets/` | `sport`, `min_edge` | Ranked +EV picks; stake personalized when logged in. |

`best-bets` items include `edge_pct`, `expected_value`, `kelly_fraction`, and (auth) `recommended_stake`.
Every predictive response carries a responsible-gambling `disclaimer`.

## Content

| Method | Path | Notes |
|---|---|---|
| GET | `/articles/` | Published news + Betting-101 guides (filter `?category=guide`). |
| GET | `/articles/{slug}/` | Full article. |

## Health

`GET /api/health/` → `{status, checks:{database}}` (200 healthy, 503 degraded).
