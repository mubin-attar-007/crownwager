"""FastAPI app exposing the decoupled prediction service.

Endpoints:
    GET  /health   → liveness + active model descriptor
    POST /predict  → score a batch of games, returning structured per-market picks
"""
from __future__ import annotations

from fastapi import FastAPI

from .model_registry import active_model
from .prediction_engine import DISCLAIMER, predict_games
from .schemas import PredictRequest, PredictResponse

app = FastAPI(
    title="OddsAway AI Service",
    version="0.1.0",
    description="Decoupled ML prediction service for OddsAway. Informational only; 18+.",
)


@app.get("/health")
def health() -> dict:
    model = active_model()
    return {
        "status": "ok",
        "service": "oddsaway-ai",
        "model": {"name": model.name, "version": model.version, "validated": model.validated},
    }


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest) -> PredictResponse:
    predictions, model = predict_games(request.games)
    return PredictResponse(
        model_version=f"{model.name}-{model.version}",
        generated_by=model.name,
        disclaimer=DISCLAIMER,
        predictions=predictions,
    )
