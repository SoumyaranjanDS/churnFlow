from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

import pandas as pd
from sklearn.model_selection import train_test_split

from src.config import TrainingDefaults
from src.data.dataset import load_dataset, prepare_training_data
from src.evaluation.metrics import (
    compute_classification_metrics,
    tune_threshold,
)
from src.features.feature_engineering import BusinessFeatureEngineer
from src.features.preprocessing import build_preprocessor
from src.registry import copy_artifacts, export_artifacts
from src.training.models import build_model_pipeline, get_model_candidates


FEATURE_ALIASES: Dict[str, List[str]] = {
    "tenure_months": ["tenure_months", "tenure in months", "tenure", "tenure_month"],
    "monthly_charges": ["monthly_charges", "monthly charge", "monthly charges", "monthlycharge"],
    "contract": ["contract"],
    "internet_service": ["internet_service", "internet service", "internetservice"],
    "tech_support": ["tech_support", "tech support", "techsupport"],
}

DEFAULT_DATASET_PATH = str(Path(__file__).resolve().parents[4] / "ibm" / "Telco_customer_churn.xlsx")


def _normalize_name(name: str) -> str:
    return "_".join(name.strip().lower().replace("-", " ").split())


def _resolve_feature_columns(features: pd.DataFrame) -> Dict[str, str]:
    normalized_to_original = {_normalize_name(column): column for column in features.columns}
    resolved = {}

    for canonical, aliases in FEATURE_ALIASES.items():
        resolved_column = None
        for alias in aliases:
            candidate = normalized_to_original.get(_normalize_name(alias))
            if candidate:
                resolved_column = candidate
                break
        if not resolved_column:
            raise ValueError(
                f"Required feature '{canonical}' not found in dataset. "
                f"Expected one of aliases: {aliases}"
            )
        resolved[canonical] = resolved_column

    return resolved


def _build_model_input(features: pd.DataFrame) -> pd.DataFrame:
    resolved = _resolve_feature_columns(features)
    model_input = pd.DataFrame(
        {
            "tenure_months": features[resolved["tenure_months"]],
            "monthly_charges": features[resolved["monthly_charges"]],
            "contract": features[resolved["contract"]],
            "internet_service": features[resolved["internet_service"]],
            "tech_support": features[resolved["tech_support"]],
        }
    )
    return model_input


def _parse_args() -> argparse.Namespace:
    defaults = TrainingDefaults()
    parser = argparse.ArgumentParser(description="Train churn model and export production artifacts.")
    parser.add_argument(
        "--input-path",
        default=DEFAULT_DATASET_PATH,
        help="Path to input dataset (.xlsx/.xls/.csv). Defaults to project ibm dataset.",
    )
    parser.add_argument(
        "--artifacts-dir",
        default=str(Path(__file__).resolve().parents[2] / "artifacts"),
        help="Directory where training artifacts will be written.",
    )
    parser.add_argument(
        "--export-to-ml-api",
        action="store_true",
        help="Copy final artifacts into services/ml-api/models/production.",
    )
    parser.add_argument(
        "--selection-metric",
        default=defaults.selection_metric,
        choices=["f1", "pr_auc", "roc_auc", "precision", "recall", "accuracy"],
        help="Metric used to choose best model on validation split.",
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
        help="Validation fraction from train+validation pool.",
    )
    return parser.parse_args()


def _evaluate_model(
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

    result = {
        "model": model_name,
        "threshold": threshold,
        "threshold_metrics": threshold_metrics,
        "validation_metrics": metrics,
    }
    return result


def _select_best_candidate(candidate_results: List[Dict[str, object]], selection_metric: str) -> Dict[str, object]:
    if not candidate_results:
        raise ValueError("No candidate model results found for selection.")

    ranked = sorted(
        candidate_results,
        key=lambda item: float(item["validation_metrics"][selection_metric]),
        reverse=True,
    )
    return ranked[0]


def _copy_to_ml_api(artifacts_dir: Path) -> None:
    ml_api_dir = Path(__file__).resolve().parents[3] / "ml-api" / "models" / "production"
    copy_artifacts(source_dir=artifacts_dir, target_dir=ml_api_dir)


def main() -> None:
    args = _parse_args()
    input_path = Path(args.input_path).expanduser().resolve()
    artifacts_dir = Path(args.artifacts_dir).expanduser().resolve()

    raw_df = load_dataset(str(input_path))
    features_raw, target, target_column = prepare_training_data(raw_df)
    features = _build_model_input(features_raw)

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

    engineered_preview = BusinessFeatureEngineer().fit_transform(features)
    _, numeric_columns, categorical_columns = build_preprocessor(engineered_preview)
    model_candidates = get_model_candidates(args.random_state)

    candidate_results: List[Dict[str, object]] = []
    for model_name, model in model_candidates.items():
        candidate_preprocessor, _, _ = build_preprocessor(engineered_preview)
        pipeline = build_model_pipeline(
            candidate_preprocessor,
            model,
            feature_engineer=BusinessFeatureEngineer(),
        )
        result = _evaluate_model(
            model_name=model_name,
            pipeline=pipeline,
            x_train=x_train,
            y_train=y_train,
            x_val=x_val,
            y_val=y_val,
            min_precision=args.min_precision,
        )
        candidate_results.append(result)

    best_candidate = _select_best_candidate(candidate_results, selection_metric=args.selection_metric)

    final_preprocessor, _, _ = build_preprocessor(engineered_preview)
    final_model = get_model_candidates(args.random_state)[best_candidate["model"]]
    final_pipeline = build_model_pipeline(
        final_preprocessor,
        final_model,
        feature_engineer=BusinessFeatureEngineer(),
    )
    final_pipeline.fit(x_train_val, y_train_val)

    test_probabilities = final_pipeline.predict_proba(x_test)[:, 1]
    best_threshold = float(best_candidate["threshold"])
    test_metrics = compute_classification_metrics(y_test, test_probabilities, threshold=best_threshold)

    trained_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    metadata = {
        "model_name": best_candidate["model"],
        "model_version": f"{best_candidate['model']}-{trained_at}",
        "trained_at_utc": trained_at,
        "input_path": str(input_path),
        "target_column": target_column,
        "features_used_raw_contract": list(features.columns),
        "features_after_engineering": list(engineered_preview.columns),
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "selection_metric": args.selection_metric,
        "threshold": best_threshold,
        "random_state": args.random_state,
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

    if args.export_to_ml_api:
        _copy_to_ml_api(artifacts_dir)

    print("Training complete.")
    print(f"Best model: {best_candidate['model']}")
    print(f"Selection metric ({args.selection_metric}): {best_candidate['validation_metrics'][args.selection_metric]:.4f}")
    print(f"Test F1: {test_metrics['f1']:.4f}")
    print(f"Artifacts: {artifacts_dir}")
    if args.export_to_ml_api:
        print("Artifacts copied to services/ml-api/models/production")


if __name__ == "__main__":
    main()
