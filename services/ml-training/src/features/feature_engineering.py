from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin


class BusinessFeatureEngineer(BaseEstimator, TransformerMixin):
    """Adds churn-oriented interaction features while preserving original inputs."""

    def fit(self, x: pd.DataFrame, y=None):
        return self

    def transform(self, x: pd.DataFrame) -> pd.DataFrame:
        frame = x.copy()

        tenure = pd.to_numeric(frame["tenure_months"], errors="coerce").fillna(0)
        monthly = pd.to_numeric(frame["monthly_charges"], errors="coerce").fillna(0)
        contract = frame["contract"].astype(str).str.strip().str.lower()
        internet = frame["internet_service"].astype(str).str.strip().str.lower()
        tech_support = frame["tech_support"].astype(str).str.strip().str.lower()

        frame["tenure_log1p"] = np.log1p(tenure)
        frame["monthly_log1p"] = np.log1p(monthly)
        frame["charges_per_tenure"] = monthly / (tenure + 1.0)
        frame["tenure_x_monthly"] = tenure * monthly

        frame["is_month_to_month"] = (contract == "month-to-month").astype(int)
        frame["is_long_contract"] = contract.isin(["one year", "two year"]).astype(int)
        frame["is_fiber"] = (internet == "fiber optic").astype(int)
        frame["no_tech_support"] = (tech_support == "no").astype(int)
        frame["fiber_and_no_support"] = (
            ((internet == "fiber optic") & (tech_support == "no")).astype(int)
        )
        frame["high_charge_low_tenure"] = ((monthly >= 80) & (tenure <= 12)).astype(int)

        return frame
