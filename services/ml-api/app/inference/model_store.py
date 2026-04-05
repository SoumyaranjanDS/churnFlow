from __future__ import annotations

import json
import sys
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Tuple

import joblib
import pandas as pd

DEFAULT_MODEL_VERSION = "rules-v0.2.0"
MODEL_DIR = Path(__file__).resolve().parents[2] / "models" / "production"
MODEL_BUNDLE_PATH = MODEL_DIR / "model_bundle.joblib"
METADATA_PATH = MODEL_DIR / "metadata.json"
METRICS_PATH = MODEL_DIR / "metrics.json"
TRAINING_SERVICE_DIR = Path(__file__).resolve().parents[3] / "ml-training"

if TRAINING_SERVICE_DIR.exists():
    training_path = str(TRAINING_SERVICE_DIR)
    if training_path not in sys.path:
        sys.path.insert(0, training_path)


def _read_json(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _load_artifacts_from_paths(
    model_bundle_path: Path,
    metadata_path: Path,
    metrics_path: Path,
) -> Dict[str, Any]:
    metadata = _read_json(metadata_path)
    metrics = _read_json(metrics_path)

    if not model_bundle_path.exists():
        return {
            "loaded": False,
            "model": None,
            "metadata": metadata,
            "metrics": metrics,
            "model_version": metadata.get("model_version", DEFAULT_MODEL_VERSION),
            "threshold": float(metadata.get("threshold", 0.5)),
            "reason": f"Missing model bundle at {model_bundle_path}",
        }

    try:
        model = joblib.load(model_bundle_path)
        return {
            "loaded": True,
            "model": model,
            "metadata": metadata,
            "metrics": metrics,
            "model_version": metadata.get("model_version", DEFAULT_MODEL_VERSION),
            "threshold": float(metadata.get("threshold", 0.5)),
            "reason": "",
        }
    except Exception as error:
        return {
            "loaded": False,
            "model": None,
            "metadata": metadata,
            "metrics": metrics,
            "model_version": metadata.get("model_version", DEFAULT_MODEL_VERSION),
            "threshold": float(metadata.get("threshold", 0.5)),
            "reason": f"Failed to load model bundle: {error}",
        }


@lru_cache(maxsize=1)
def load_artifacts() -> Dict[str, Any]:
    return _load_artifacts_from_paths(MODEL_BUNDLE_PATH, METADATA_PATH, METRICS_PATH)


@lru_cache(maxsize=64)
def load_artifacts_from_dir(artifact_dir: str) -> Dict[str, Any]:
    model_dir = Path(artifact_dir).expanduser().resolve()
    return _load_artifacts_from_paths(
        model_dir / "model_bundle.joblib",
        model_dir / "metadata.json",
        model_dir / "metrics.json",
    )


def reload_artifacts() -> Tuple[Dict[str, Any], Dict[str, Any]]:
    previous = load_artifacts()
    load_artifacts.cache_clear()
    current = load_artifacts()
    return previous, current


def clip_probability(value: float) -> float:
    return max(0.01, min(0.99, round(float(value), 4)))


def predict_probability_from_model(payload: Dict[str, Any], artifacts: Dict[str, Any]) -> float:
    frame = pd.DataFrame([payload])
    probability = artifacts["model"].predict_proba(frame)[:, 1][0]
    return clip_probability(probability)


def fallback_probability(payload: Dict[str, Any]) -> float:
    score = 0.10

    contract = str(payload.get("contract", "")).lower()
    internet_service = str(payload.get("internet_service", "")).lower()
    tech_support = str(payload.get("tech_support", "")).lower()
    monthly_charges = float(payload.get("monthly_charges", 0))
    tenure_months = int(payload.get("tenure_months", 0))

    if contract == "month-to-month":
        score += 0.25
    elif contract in {"one year", "two year"}:
        score -= 0.08

    if internet_service == "fiber optic":
        score += 0.14

    if tech_support == "no":
        score += 0.10

    if monthly_charges >= 80:
        score += 0.16
    elif monthly_charges >= 65:
        score += 0.08

    if tenure_months <= 6:
        score += 0.18
    elif tenure_months <= 12:
        score += 0.10
    elif tenure_months >= 48:
        score -= 0.08

    return clip_probability(score)
