import numpy as np

from src.evaluation.metrics import compute_classification_metrics, tune_threshold


def test_compute_classification_metrics_includes_confusion_and_fpr():
    y_true = np.array([0, 0, 1, 1, 1, 0])
    y_prob = np.array([0.10, 0.80, 0.90, 0.30, 0.60, 0.40])

    metrics = compute_classification_metrics(y_true, y_prob, threshold=0.5)

    assert "confusion_matrix" in metrics
    assert metrics["confusion_matrix"] == {"tn": 2, "fp": 1, "fn": 1, "tp": 2}
    assert round(metrics["fpr"], 4) == round(1 / 3, 4)
    assert round(metrics["fnr"], 4) == round(1 / 3, 4)


def test_tune_threshold_respects_min_precision():
    y_true = np.array([0, 0, 1, 1, 1, 1])
    y_prob = np.array([0.20, 0.30, 0.40, 0.60, 0.80, 0.90])

    threshold, threshold_metrics = tune_threshold(y_true, y_prob, min_precision=0.75)

    assert 0.0 <= threshold <= 1.0
    assert threshold_metrics["precision"] >= 0.75
