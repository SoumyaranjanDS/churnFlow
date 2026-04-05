from __future__ import annotations

from typing import Dict, Tuple

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
)


def tune_threshold(
    y_true,
    y_prob,
    min_precision: float = 0.0,
) -> Tuple[float, Dict[str, float]]:
    precisions, recalls, thresholds = precision_recall_curve(y_true, y_prob)

    if thresholds.size == 0:
        return 0.5, {"precision": 0.0, "recall": 0.0, "f1": 0.0}

    best_threshold = 0.5
    best_precision = 0.0
    best_recall = 0.0
    best_f1 = -1.0

    for threshold in thresholds:
        predictions = (y_prob >= threshold).astype(int)
        precision = precision_score(y_true, predictions, zero_division=0)
        recall = recall_score(y_true, predictions, zero_division=0)
        f1 = f1_score(y_true, predictions, zero_division=0)

        if precision < min_precision:
            continue

        if f1 > best_f1:
            best_threshold = float(threshold)
            best_precision = float(precision)
            best_recall = float(recall)
            best_f1 = float(f1)

    if best_f1 < 0:
        # Fallback if all thresholds violate min_precision.
        predictions = (y_prob >= 0.5).astype(int)
        best_threshold = 0.5
        best_precision = float(precision_score(y_true, predictions, zero_division=0))
        best_recall = float(recall_score(y_true, predictions, zero_division=0))
        best_f1 = float(f1_score(y_true, predictions, zero_division=0))

    return best_threshold, {"precision": best_precision, "recall": best_recall, "f1": best_f1}


def compute_classification_metrics(y_true, y_prob, threshold: float) -> Dict[str, object]:
    predictions = (y_prob >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, predictions, labels=[0, 1]).ravel()

    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    fnr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0
    tnr = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    npv = float(tn / (tn + fn)) if (tn + fn) > 0 else 0.0

    return {
        "threshold": float(threshold),
        "accuracy": float(accuracy_score(y_true, predictions)),
        "precision": float(precision_score(y_true, predictions, zero_division=0)),
        "recall": float(recall_score(y_true, predictions, zero_division=0)),
        "f1": float(f1_score(y_true, predictions, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, y_prob)),
        "pr_auc": float(average_precision_score(y_true, y_prob)),
        "fpr": fpr,
        "fnr": fnr,
        "tnr": tnr,
        "npv": npv,
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp),
        },
    }


def to_serializable(value):
    if isinstance(value, dict):
        return {k: to_serializable(v) for k, v in value.items()}
    if isinstance(value, list):
        return [to_serializable(v) for v in value]
    if isinstance(value, tuple):
        return [to_serializable(v) for v in value]
    if isinstance(value, np.generic):
        return value.item()
    return value
