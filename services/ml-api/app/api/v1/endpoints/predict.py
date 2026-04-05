from __future__ import annotations

import hmac
from typing import Any, Dict

from fastapi import APIRouter, Header, HTTPException, status

from app.core.settings import get_settings
from app.inference.model_store import (
    DEFAULT_MODEL_VERSION,
    fallback_probability,
    load_artifacts,
    load_artifacts_from_dir,
    predict_probability_from_model,
    reload_artifacts,
)
from app.monitoring.logger import get_logger
from app.schemas.request import BatchPredictRequest, PredictRequest, TenantPredictRequest
from app.schemas.response import (
    BatchPredictResponse,
    ModelInfoResponse,
    PredictResponse,
    ReloadModelResponse,
)

router = APIRouter()
logger = get_logger(__name__)


def _authorize_reload(x_reload_api_key: str | None) -> None:
    settings = get_settings()
    require_key = settings.require_reload_api_key or bool(settings.reload_api_key)

    if require_key and not settings.reload_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Reload security is enabled but ML_API_RELOAD_API_KEY is not configured.",
        )

    if not require_key:
        return

    if not x_reload_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing x-reload-api-key header.",
        )

    if not hmac.compare_digest(x_reload_api_key, settings.reload_api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid reload API key.",
        )


def compute_probability(payload: PredictRequest) -> float:
    artifacts = load_artifacts()
    payload_data = payload.model_dump()

    if artifacts["loaded"] and artifacts["model"] is not None:
        return predict_probability_from_model(payload_data, artifacts)
    return fallback_probability(payload_data)


def compute_tenant_probability(payload: TenantPredictRequest) -> tuple[float, Dict[str, Any]]:
    artifacts = load_artifacts_from_dir(payload.artifact_dir)
    payload_data = payload.features or {}

    if artifacts["loaded"] and artifacts["model"] is not None:
        return predict_probability_from_model(payload_data, artifacts), artifacts

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=artifacts["reason"] or "Custom model could not be loaded.",
    )


def _to_model_info_response(artifacts: Dict[str, Any]) -> ModelInfoResponse:
    return ModelInfoResponse(
        model_version=artifacts["model_version"],
        service="ml-inference",
        task="customer-churn-prediction",
        model_loaded=bool(artifacts["loaded"]),
        fallback_mode=not bool(artifacts["loaded"]),
        threshold=float(artifacts["threshold"]),
        load_message=str(artifacts["reason"]),
    )


def to_risk_band(probability: float) -> str:
    if probability >= 0.75:
        return "High"
    if probability >= 0.40:
        return "Medium"
    return "Low"


@router.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    artifacts = load_artifacts()
    probability = compute_probability(payload)
    risk_band = to_risk_band(probability)

    return PredictResponse(
        churn_probability=probability,
        risk_band=risk_band,
        model_version=artifacts["model_version"],
    )


@router.post("/predict-tenant", response_model=PredictResponse)
def predict_tenant(payload: TenantPredictRequest) -> PredictResponse:
    probability, artifacts = compute_tenant_probability(payload)
    risk_band = to_risk_band(probability)

    return PredictResponse(
        churn_probability=probability,
        risk_band=risk_band,
        model_version=artifacts["model_version"],
    )


@router.post("/predict-batch", response_model=BatchPredictResponse)
def predict_batch(payload: BatchPredictRequest) -> BatchPredictResponse:
    artifacts = load_artifacts()
    predictions = []

    for record in payload.records:
        probability = compute_probability(record)
        predictions.append(
            PredictResponse(
                churn_probability=probability,
                risk_band=to_risk_band(probability),
                model_version=artifacts["model_version"],
            )
        )

    return BatchPredictResponse(model_version=artifacts["model_version"], predictions=predictions)


@router.get("/model-info", response_model=ModelInfoResponse)
def model_info() -> ModelInfoResponse:
    artifacts = load_artifacts()
    return _to_model_info_response(artifacts)


@router.post("/reload-model", response_model=ReloadModelResponse)
def reload_model(x_reload_api_key: str | None = Header(default=None)) -> ReloadModelResponse:
    _authorize_reload(x_reload_api_key)
    previous, current = reload_artifacts()

    changed = (
        previous.get("model_version") != current.get("model_version")
        or bool(previous.get("loaded")) != bool(current.get("loaded"))
        or float(previous.get("threshold", 0.5)) != float(current.get("threshold", 0.5))
    )

    logger.info(
        "model_reload executed changed=%s previous=%s current=%s loaded=%s",
        changed,
        previous.get("model_version", DEFAULT_MODEL_VERSION),
        current.get("model_version", DEFAULT_MODEL_VERSION),
        bool(current.get("loaded")),
    )

    return ReloadModelResponse(
        success=True,
        previous_model_version=str(previous.get("model_version", DEFAULT_MODEL_VERSION)),
        model_version=str(current.get("model_version", DEFAULT_MODEL_VERSION)),
        model_loaded=bool(current.get("loaded")),
        fallback_mode=not bool(current.get("loaded")),
        threshold=float(current.get("threshold", 0.5)),
        changed=changed,
        load_message=str(current.get("reason", "")),
    )
