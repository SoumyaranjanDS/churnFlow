from __future__ import annotations

from typing import Dict, Optional

from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


def get_model_candidates(random_state: int) -> Dict[str, object]:
    return {
        "logistic_regression": LogisticRegression(
            max_iter=3000,
            class_weight="balanced",
            random_state=random_state,
            C=1.5,
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=700,
            max_depth=None,
            min_samples_leaf=1,
            class_weight="balanced_subsample",
            random_state=random_state,
            n_jobs=-1,
        ),
        "extra_trees": ExtraTreesClassifier(
            n_estimators=700,
            max_depth=None,
            min_samples_leaf=1,
            class_weight="balanced",
            random_state=random_state,
            n_jobs=-1,
        ),
    }


def build_model_pipeline(preprocessor, model, feature_engineer: Optional[object] = None) -> Pipeline:
    steps = []
    if feature_engineer is not None:
        steps.append(("feature_engineering", feature_engineer))
    steps.extend(
        [
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )
    return Pipeline(steps=steps)
