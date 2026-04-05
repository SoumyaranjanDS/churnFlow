from typing import Any, Dict, List
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    tenure_months: int = Field(ge=0)
    monthly_charges: float = Field(ge=0)
    contract: str
    internet_service: str
    tech_support: str


class BatchPredictRequest(BaseModel):
    records: List[PredictRequest]


class TenantPredictRequest(BaseModel):
    artifact_dir: str = Field(min_length=1)
    features: Dict[str, Any] = Field(default_factory=dict)
