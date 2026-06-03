"""Model registry: discover, validate, and load the serving model with provenance metadata.

The legacy project shipped opaque, timestamp-named binaries with no metadata, no checksums, and a
cherry-picked "accuracy". This registry instead loads a model that was honestly validated
(see ai/train/train_nba_ml.py → 5-fold CV) together with its feature order and a per-team stats
snapshot for serving. If the model files aren't present it falls back to the transparent baseline.
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
from dataclasses import dataclass, field
from pathlib import Path

logger = logging.getLogger(__name__)

MODEL_DIR = Path(os.getenv("MODEL_DIR", Path(__file__).resolve().parent.parent / "models"))

MODEL_FILE = MODEL_DIR / "xgboost_nba_ml.json"
FEATURES_FILE = MODEL_DIR / "xgboost_nba_ml.features.json"
TEAMS_FILE = MODEL_DIR / "team_features.json"
METRICS_FILE = MODEL_DIR / "xgboost_nba_ml.metrics.json"


@dataclass
class ModelInfo:
    name: str
    version: str
    validated: bool = False
    metrics: dict = field(default_factory=dict)
    notes: str = ""


def _sha256(path: Path) -> str | None:
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else None


# ── Lazy, cached load of the serving model + its serving assets ────
_assets: dict | None = None
_loaded = False


def load_ml_assets() -> dict | None:
    """Return {model, feature_columns, team_features} for the validated XGBoost model, or None."""
    global _assets, _loaded
    if _loaded:
        return _assets
    _loaded = True
    if not (MODEL_FILE.exists() and FEATURES_FILE.exists() and TEAMS_FILE.exists()):
        logger.info("No validated ML model found in %s; using baseline.", MODEL_DIR)
        _assets = None
        return None
    try:
        import xgboost as xgb

        clf = xgb.XGBClassifier()
        clf.load_model(str(MODEL_FILE))
        _assets = {
            "model": clf,
            "feature_columns": json.loads(FEATURES_FILE.read_text()),
            "team_features": json.loads(TEAMS_FILE.read_text()),
        }
        logger.info("Loaded XGBoost model with %d teams.", len(_assets["team_features"]))
    except Exception as exc:  # pragma: no cover
        logger.warning("Failed to load XGBoost model: %s", exc)
        _assets = None
    return _assets


def active_model() -> ModelInfo:
    """Describe the model currently serving predictions."""
    if load_ml_assets():
        metrics = json.loads(METRICS_FILE.read_text()) if METRICS_FILE.exists() else {}
        return ModelInfo(
            name="xgboost_nba_ml",
            version="1",
            validated=True,
            metrics=metrics,
            notes="XGBoost NBA moneyline model, honestly validated via 5-fold CV (no cherry-picking).",
        )
    return ModelInfo(
        name="baseline",
        version="v0",
        validated=False,
        notes="Transparent heuristic (home-court + ratings + rest). Used until a model is available.",
    )
