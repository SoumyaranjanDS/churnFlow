from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple

import pandas as pd
from sklearn.model_selection import train_test_split

from src.config import TrainingDefaults
from src.data.dataset import load_dataset
from src.evaluation.metrics import compute_classification_metrics, tune_threshold
from src.features.feature_engineering import BusinessFeatureEngineer
from src.features.preprocessing import build_preprocessor
from src.registry import export_artifacts
from src.training.models import build_model_pipeline, get_model_candidates


TELECOM_FEATURES = {
    "tenure_months",
    "monthly_charges",
    "contract",
    "internet_service",
    "tech_support",
}
POSITIVE_LABELS = {
    "1",
    "yes",
    "true",
    "churn",
    "churned",
    "cancelled",
    "canceled",
    "inactive",
    "left",
    "lost",
}
NEGATIVE_LABELS = {
    "0",
    "no",
    "false",
    "active",
    "retained",
    "stay",
    "stayed",
}


def parse_args() -> argparse.Namespace:
    defaults = TrainingDefaults()
    parser = argparse.ArgumentParser(description="Train a tenant-specific churn model from confirmed onboarding mappings.")
    parser.add_argument("--input-path", required=True, help="Path to the uploaded tenant dataset.")
    parser.add_argument("--artifacts-dir", required=True, help="Directory to write model artifacts into.")
    parser.add_argument("--target-column", required=True, help="Confirmed source column that represents churn.")
    parser.add_argument(
        "--feature-mappings-json",
        required=True,
        help="JSON array of confirmed feature mappings: [{sourceColumn,targetField}]",
    )
    parser.add_argument("--tenant-id", required=True, help="Tenant id for metadata.")
    parser.add_argument("--job-id", required=True, help="Training job id for metadata.")
    parser.add_argument("--model-version", required=True, help="Model version label.")
    parser.add_argument(
        "--selection-metric",
        default=defaults.selection_metric,
        choices=["f1", "pr_auc", "roc_auc", "precision", "recall", "accuracy"],
        help="Metric used to choose the best candidate.",
    )
    parser.add_argument("--random-state", type=int, default=defaults.random_state, help="Random seed.")
    parser.add_argument(
        "--min-precision",
        type=float,
        default=defaults.min_precision,
        help="Minimum precision constraint while tuning threshold.",
    )
    parser.add_argument("--test-size", type=float, default=defaults.test_size, help="Holdout test fraction.")
    parser.add_argument(
        "--val-size",
        type=float,
        default=defaults.val_size,
        help="Validation fraction from the train+validation pool.",
    )
    return parser.parse_args()


def normalize_column_name(value: str) -> str:
    return "_".join(str(value or "").strip().lower().replace("-", " ").split())


def is_identifier_mapping(source_column: str, target_field: str) -> bool:
    normalized_source = normalize_column_name(source_column)
    normalized_target = normalize_column_name(target_field)
    identifier_tokens = {"customer_id", "account_id", "user_id", "id"}

    return (
        normalized_target in identifier_tokens
        or normalized_source in identifier_tokens
        or normalized_target.endswith("_id")
        or normalized_source.endswith("_id")
    )


def normalize_feature_mappings(raw_mappings: str) -> List[Dict[str, str]]:
    parsed = json.loads(raw_mappings)
    if not isinstance(parsed, list) or not parsed:
        raise ValueError("feature_mappings_json must be a non-empty JSON array.")

    normalized: List[Dict[str, str]] = []
    used_targets: Dict[str, int] = {}

    for item in parsed:
        source_column = str(item.get("sourceColumn") or "").strip()
        target_field = str(item.get("targetField") or "").strip()
        if not source_column or not target_field:
            continue

        occurrence = used_targets.get(target_field, 0) + 1
        used_targets[target_field] = occurrence
        feature_name = target_field if occurrence == 1 else f"{target_field}_{occurrence}"

        normalized.append(
            {
                "source_column": source_column,
                "target_field": target_field,
                "feature_name": feature_name,
            }
        )

    if not normalized:
        raise ValueError("No usable feature mappings were provided.")

    return normalized


def normalize_target_series(series: pd.Series) -> Tuple[pd.Series, Dict[str, object]]:
    if pd.api.types.is_numeric_dtype(series):
        numeric_target = pd.to_numeric(series, errors="coerce")
        normalized = numeric_target.map(lambda value: 1 if value == 1 else (0 if value == 0 else None))
        return normalized, {"mode": "numeric_01"}

    normalized_raw = series.astype(str).str.strip().str.lower()
    unique_values = sorted([value for value in normalized_raw.dropna().unique().tolist() if value])

    mapped = normalized_raw.map(
        lambda value: 1
        if value in POSITIVE_LABELS
        else (0 if value in NEGATIVE_LABELS else None)
    )

    if mapped.notna().sum() == 0:
        raise ValueError(
            "Target column could not be normalized into a binary churn label. "
            f"Found values: {unique_values[:12]}"
        )

    return mapped, {"mode": "string_lookup", "unique_values_preview": unique_values[:12]}


def build_training_frame(
    df: pd.DataFrame,
    target_column: str,
    feature_mappings: List[Dict[str, str]],
) -> Tuple[pd.DataFrame, pd.Series, Dict[str, object]]:
    if target_column not in df.columns:
        raise ValueError(f"Target column not found in dataset: {target_column}")

    target_raw = df[target_column]
    target, target_metadata = normalize_target_series(target_raw)
    valid_mask = target.notna()

    working = df.loc[valid_mask].copy()
    target = target.loc[valid_mask].astype(int)

    rename_map: Dict[str, str] = {}
    feature_contract: List[Dict[str, str]] = []
    identifier_contract: List[Dict[str, str]] = []
    for item in feature_mappings:
        source_column = item["source_column"]
        if source_column == target_column or source_column not in working.columns:
            continue

        contract_item = {
            "source_column": source_column,
            "target_field": item["target_field"],
            "feature_name": item["feature_name"],
        }

        if is_identifier_mapping(source_column, item["target_field"]):
            identifier_contract.append(contract_item)
            continue

        feature_name = item["feature_name"]
        rename_map[source_column] = feature_name
        feature_contract.append(contract_item)

    if not rename_map:
        raise ValueError("No usable non-identifier feature mappings matched the uploaded dataset columns.")

    features = working[list(rename_map.keys())].rename(columns=rename_map)
    constant_columns = [column for column in features.columns if features[column].nunique(dropna=False) <= 1]
    if constant_columns:
        features = features.drop(columns=constant_columns, errors="ignore")
        feature_contract = [item for item in feature_contract if item["feature_name"] not in constant_columns]

    if features.empty:
        raise ValueError("No usable feature columns remain after dropping constants.")

    metadata = {
        "target_metadata": target_metadata,
        "feature_contract": feature_contract,
        "identifier_contract": identifier_contract,
    }
    return features, target, metadata


def evaluate_model(
    model_name: str,
    pipeline,
    x_train: pd.DataFrame,
    y_train: pd.Series,
    x_val: pd.DataFrame,
    y_val: pd.Series,
    min_precision: float,
) -> Dict[str, object]:
    pipeline.fit(x_train, y_train)
    val_probabilities = pipeline.predict_proba(x_val)[:, 1]

    threshold, threshold_metrics = tune_threshold(y_val, val_probabilities, min_precision=min_precision)
    metrics = compute_classification_metrics(y_val, val_probabilities, threshold=threshold)

    return {
        "model": model_name,
        "threshold": threshold,
        "threshold_metrics": threshold_metrics,
        "validation_metrics": metrics,
    }


def select_best_candidate(candidate_results: List[Dict[str, object]], selection_metric: str) -> Dict[str, object]:
    if not candidate_results:
        raise ValueError("No candidate model results were produced.")

    ranked = sorted(
        candidate_results,
        key=lambda item: float(item["validation_metrics"][selection_metric]),
        reverse=True,
    )
    return ranked[0]


def main() -> None:
    args = parse_args()
    input_path = Path(args.input_path).expanduser().resolve()
    artifacts_dir = Path(args.artifacts_dir).expanduser().resolve()

    raw_df = load_dataset(str(input_path))
    feature_mappings = normalize_feature_mappings(args.feature_mappings_json)
    features, target, contract_metadata = build_training_frame(raw_df, args.target_column, feature_mappings)

    x_train_val, x_test, y_train_val, y_test = train_test_split(
        features,
        target,
        test_size=args.test_size,
        random_state=args.random_state,
        stratify=target,
    )
    x_train, x_val, y_train, y_val = train_test_split(
        x_train_val,
        y_train_val,
        test_size=args.val_size,
        random_state=args.random_state,
        stratify=y_train_val,
    )

    use_feature_engineering = TELECOM_FEATURES.issubset(set(features.columns))
    feature_engineer = BusinessFeatureEngineer() if use_feature_engineering else None
    engineered_preview = feature_engineer.fit_transform(features) if feature_engineer else features.copy()
    _, numeric_columns, categorical_columns = build_preprocessor(engineered_preview)

    candidate_results: List[Dict[str, object]] = []
    for model_name, model in get_model_candidates(args.random_state).items():
        candidate_preprocessor, _, _ = build_preprocessor(engineered_preview)
        pipeline = build_model_pipeline(candidate_preprocessor, model, feature_engineer=feature_engineer)
        result = evaluate_model(
            model_name=model_name,
            pipeline=pipeline,
            x_train=x_train,
            y_train=y_train,
            x_val=x_val,
            y_val=y_val,
            min_precision=args.min_precision,
        )
        candidate_results.append(result)

    best_candidate = select_best_candidate(candidate_results, selection_metric=args.selection_metric)

    final_preprocessor, _, _ = build_preprocessor(engineered_preview)
    final_model = get_model_candidates(args.random_state)[best_candidate["model"]]
    final_pipeline = build_model_pipeline(final_preprocessor, final_model, feature_engineer=feature_engineer)
    final_pipeline.fit(x_train_val, y_train_val)

    test_probabilities = final_pipeline.predict_proba(x_test)[:, 1]
    best_threshold = float(best_candidate["threshold"])
    test_metrics = compute_classification_metrics(y_test, test_probabilities, threshold=best_threshold)

    trained_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    metadata = {
        "model_name": best_candidate["model"],
        "model_version": args.model_version,
        "trained_at_utc": trained_at,
        "tenant_id": args.tenant_id,
        "job_id": args.job_id,
        "input_path": str(input_path),
        "target_column": args.target_column,
        "features_used_raw_contract": [item["source_column"] for item in contract_metadata["feature_contract"]],
        "feature_contract": contract_metadata["feature_contract"],
        "identifier_contract": contract_metadata["identifier_contract"],
        "identifier_columns": [item["source_column"] for item in contract_metadata["identifier_contract"]],
        "features_after_engineering": list(engineered_preview.columns),
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "selection_metric": args.selection_metric,
        "threshold": best_threshold,
        "random_state": args.random_state,
        "used_telecom_feature_engineering": use_feature_engineering,
        "target_metadata": contract_metadata["target_metadata"],
    }
    metrics = {
        "validation": best_candidate["validation_metrics"],
        "test": test_metrics,
        "threshold_metrics_on_validation": best_candidate["threshold_metrics"],
        "all_candidates_validation": candidate_results,
    }

    export_artifacts(
        artifacts_dir=artifacts_dir,
        model_pipeline=final_pipeline,
        metadata=metadata,
        metrics=metrics,
    )

    print("Custom tenant training complete.")
    print(f"Best model: {best_candidate['model']}")
    print(f"Selection metric ({args.selection_metric}): {best_candidate['validation_metrics'][args.selection_metric]:.4f}")
    print(f"Test F1: {test_metrics['f1']:.4f}")
    print(f"Artifacts: {artifacts_dir}")


if __name__ == "__main__":
    main()
