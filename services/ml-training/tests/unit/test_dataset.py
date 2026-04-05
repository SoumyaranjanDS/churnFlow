import pandas as pd

from src.data.dataset import prepare_training_data


def test_prepare_training_data_drops_leakage_and_constants():
    raw = pd.DataFrame(
        {
            "CustomerID": ["A", "B", "C", "D"],
            "Churn Label": ["Yes", "No", "Yes", "No"],
            "Churn Score": [99, 2, 88, 4],
            "Contract": ["Month-to-month", "One year", "Month-to-month", "Two year"],
            "Monthly Charge": [82.5, 50.0, 91.2, 45.3],
            "AlwaysConstant": ["x", "x", "x", "x"],
        }
    )

    features, target, target_column = prepare_training_data(raw)

    assert target_column == "Churn Label"
    assert "CustomerID" not in features.columns
    assert "Churn Score" not in features.columns
    assert "AlwaysConstant" not in features.columns
    assert target.tolist() == [1, 0, 1, 0]
