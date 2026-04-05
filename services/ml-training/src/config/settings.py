from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TrainingDefaults:
    selection_metric: str = "f1"
    random_state: int = 42
    min_precision: float = 0.0
    test_size: float = 0.2
    val_size: float = 0.25
