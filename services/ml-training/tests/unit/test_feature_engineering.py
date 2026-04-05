import pandas as pd

from src.features.feature_engineering import BusinessFeatureEngineer


def test_business_feature_engineer_adds_expected_columns():
    x = pd.DataFrame(
        {
            "tenure_months": [2, 24],
            "monthly_charges": [90.0, 50.0],
            "contract": ["Month-to-month", "One year"],
            "internet_service": ["Fiber optic", "DSL"],
            "tech_support": ["No", "Yes"],
        }
    )

    transformed = BusinessFeatureEngineer().fit_transform(x)
    expected = {
        "tenure_log1p",
        "monthly_log1p",
        "charges_per_tenure",
        "tenure_x_monthly",
        "is_month_to_month",
        "is_long_contract",
        "is_fiber",
        "no_tech_support",
        "fiber_and_no_support",
        "high_charge_low_tenure",
    }

    assert expected.issubset(set(transformed.columns))
