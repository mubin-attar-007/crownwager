"""Model registry: discover and (optionally) load versioned models with provenance metadata.

The legacy project shipped opaque, timestamp-named model binaries with no metadata, no checksums,
and unverified accuracy. This registry fixes that: a ``model_manifest.yaml`` declares each model's
version, checksum, training data, and validated metrics. If a registered binary is present it can be
loaded; otherwise the service uses the transparent baseline model (clearly labelled in responses).
"""
from __future__ import annotations

import hashlib
import logging
import os
from dataclasses import dataclass, field
from pathlib import Path

import yaml

logger = logging.getLogger(__name__)

MODEL_DIR = Path(os.getenv("MODEL_DIR", Path(__file__).resolve().parent.parent / "models"))


@dataclass
class ModelInfo:
    name: str
    version: str
    file: str | None = None
    sha256: str | None = None
    metrics: dict = field(default_factory=dict)
    validated: bool = False
    notes: str = ""


def _sha256(path: Path) -> str | None:
    if not path.exists():
        return None
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def load_manifest() -> list[ModelInfo]:
    manifest_path = MODEL_DIR / "model_manifest.yaml"
    if not manifest_path.exists():
        return []
    data = yaml.safe_load(manifest_path.read_text()) or {}
    infos: list[ModelInfo] = []
    for entry in data.get("models", []):
        infos.append(
            ModelInfo(
                name=entry.get("name", "unknown"),
                version=entry.get("version", "0"),
                file=entry.get("file"),
                sha256=entry.get("sha256"),
                metrics=entry.get("metrics", {}),
                validated=bool(entry.get("validated", False)),
                notes=entry.get("notes", ""),
            )
        )
    return infos


def active_model() -> ModelInfo:
    """Return the first validated model in the manifest, else a baseline descriptor."""
    for info in load_manifest():
        if info.validated and info.file:
            binary = MODEL_DIR / info.file
            if binary.exists():
                actual = _sha256(binary)
                if info.sha256 and actual != info.sha256:
                    logger.warning("Checksum mismatch for %s; ignoring.", info.name)
                    continue
                return info
    return ModelInfo(
        name="baseline",
        version="v0",
        validated=False,
        notes="Transparent heuristic (home-court + ratings + rest). Pending a validated ML model.",
    )
