from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import joblib

from src.evaluation.metrics import to_serializable


MODEL_FILE = "model_bundle.joblib"
METRICS_FILE = "metrics.json"
METADATA_FILE = "metadata.json"


def export_artifacts(
    artifacts_dir: Path,
    model_pipeline: Any,
    metadata: Dict[str, Any],
    metrics: Dict[str, Any],
) -> None:
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model_pipeline, artifacts_dir / MODEL_FILE)
    (artifacts_dir / METRICS_FILE).write_text(json.dumps(to_serializable(metrics), indent=2), encoding="utf-8")
    (artifacts_dir / METADATA_FILE).write_text(json.dumps(to_serializable(metadata), indent=2), encoding="utf-8")


def copy_artifacts(source_dir: Path, target_dir: Path) -> None:
    target_dir.mkdir(parents=True, exist_ok=True)
    for name in [MODEL_FILE, METRICS_FILE, METADATA_FILE]:
        source = source_dir / name
        target = target_dir / name
        target.write_bytes(source.read_bytes())


def _read_json(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def read_metadata(artifacts_dir: Path) -> Dict[str, Any]:
    return _read_json(artifacts_dir / METADATA_FILE)


def read_metrics(artifacts_dir: Path) -> Dict[str, Any]:
    return _read_json(artifacts_dir / METRICS_FILE)
