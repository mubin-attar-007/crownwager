"""Pydantic request/response schemas — the AI service's structured JSON contract."""
from __future__ import annotations

from pydantic import BaseModel, Field


class MarketOdds(BaseModel):
    selection: str
    bookmaker: str = ""
    american: int = 0


class GameIn(BaseModel):
    external_id: str
    home_team: str
    away_team: str
    sport_key: str = "basketball_nba"
    sport_title: str = ""
    commence_time: str | None = None
    # Optional engineered-feature inputs (used when available; baseline applies otherwise).
    home_rating: float | None = None
    away_rating: float | None = None
    home_rest_days: int | None = None
    away_rest_days: int | None = None
    # Markets the caller wants scored (so best-bets can match selections to odds).
    market_odds: dict[str, MarketOdds] = Field(default_factory=dict)


class PredictRequest(BaseModel):
    games: list[GameIn]


class ModelPick(BaseModel):
    model_name: str
    market: str
    pick: str
    win_probability: float
    confidence: float


class GamePrediction(BaseModel):
    external_id: str
    home_team: str
    away_team: str
    sport_key: str
    sport_title: str = ""
    commence_time: str | None = None
    models: list[ModelPick]
    market_odds: dict[str, MarketOdds] = Field(default_factory=dict)


class PredictResponse(BaseModel):
    model_version: str
    generated_by: str
    disclaimer: str
    predictions: list[GamePrediction]
