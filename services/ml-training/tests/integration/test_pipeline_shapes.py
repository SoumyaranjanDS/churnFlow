import pandas as pd

from src.features.feature_engineering import BusinessFeatureEngineer
from src.features.preprocessing import build_preprocessor
from src.pipelines.train_pipeline import _build_model_input
from src.training.models import build_model_pipeline, get_model_candidates


def test_training_pipeline_components_fit_on_small_sample():
    features = pd.DataFrame(
        {
            "Tenure in Months": [1, 24, 3, 48, 7, 60],
            "Monthly Charge": [90.0, 55.0, 88.0, 45.0, 70.0, 40.0],
            "Contract": ["Month-to-month", "One year", "Month-to-month", "Two year", "One year", "Two year"],
            "Internet Service": ["Fiber optic", "DSL", "Fiber optic", "DSL", "DSL", "No"],
            "Tech Support": ["No", "Yes", "No", "Yes", "No", "Yes"],
        }
    )
    target = pd.Series([1, 0, 1, 0, 1, 0])

    model_input = _build_model_input(features)
    engineered = BusinessFeatureEngineer().fit_transform(model_input)
    preprocessor, _, _ = build_preprocessor(engineered)
    model = get_model_candidates(random_state=42)["logistic_regression"]
    pipeline = build_model_pipeline(preprocessor, model, feature_engineer=BusinessFeatureEngineer())

    pipeline.fit(model_input, target)
    probs = pipeline.predict_proba(model_input)[:, 1]

    assert len(probs) == len(target)
