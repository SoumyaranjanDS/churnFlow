from typing import List
from pydantic import BaseModel


class PredictResponse(BaseModel):
    churn_probability: float
    risk_band: str
    model_version: str


class BatchPredictResponse(BaseModel):
    model_version: str
    predictions: List[PredictResponse]


class ModelInfoResponse(BaseModel):
    model_version: str
    service: str
    task: str
    model_loaded: bool = False
    fallback_mode: bool = False
    threshold: float = 0.5
    load_message: str = ""


class ReloadModelResponse(BaseModel):
    success: bool
    previous_model_version: str
    model_version: str
    model_loaded: bool
    fallback_mode: bool
    threshold: float
    changed: bool
    load_message: str = ""
