from __future__ import annotations

from pathlib import Path
from typing import Tuple

import pandas as pd


TARGET_CANDIDATES = [
    "Churn Label",
    "Churn",
    "churn_label",
    "churn",
]

LEAKAGE_COLUMNS = {
    "Churn Value",
    "Churn Score",
    "Churn Reason",
}

DROP_COLUMNS = {
    "CustomerID",
    "Count",
    "Country",
    "State",
    "City",
    "Zip Code",
    "Lat Long",
    "Latitude",
    "Longitude",
}


def _find_column(df: pd.DataFrame, candidates: list[str]) -> str | None:
    lower_map = {column.lower(): column for column in df.columns}
    for candidate in candidates:
        matched = lower_map.get(candidate.lower())
        if matched:
            return matched
    return None


def load_dataset(input_path: str) -> pd.DataFrame:
    path = Path(input_path)
    if not path.exists():
        raise FileNotFoundError(f"Dataset file not found: {path}")

    if path.suffix.lower() in {".xlsx", ".xls"}:
        return pd.read_excel(path)
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path)

    raise ValueError(f"Unsupported dataset format: {path.suffix}. Use .xlsx/.xls or .csv")


def prepare_training_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series, str]:
    target_column = _find_column(df, TARGET_CANDIDATES)
    if not target_column:
        raise ValueError(f"Target column not found. Expected one of: {TARGET_CANDIDATES}")

    working = df.copy()
    target_raw = working[target_column]

    if target_raw.dtype == "O":
        normalized = target_raw.astype(str).str.strip().str.lower()
        target = normalized.map({"yes": 1, "no": 0})
    else:
        target = pd.to_numeric(target_raw, errors="coerce")
        target = target.map(lambda value: 1 if value == 1 else (0 if value == 0 else None))

    valid_mask = target.notna()
    working = working.loc[valid_mask].copy()
    target = target.loc[valid_mask].astype(int)

    columns_to_drop = set([target_column]) | LEAKAGE_COLUMNS | DROP_COLUMNS
    existing_to_drop = [column for column in columns_to_drop if column in working.columns]

    features = working.drop(columns=existing_to_drop, errors="ignore")

    # Drop constants because they add noise and unnecessary dimensions.
    constant_columns = [column for column in features.columns if features[column].nunique(dropna=False) <= 1]
    if constant_columns:
        features = features.drop(columns=constant_columns, errors="ignore")

    if features.empty:
        raise ValueError("No usable features remain after dropping target/leakage/constant columns.")

    return features, target, target_column
