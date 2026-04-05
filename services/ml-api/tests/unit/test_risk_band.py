from app.api.v1.endpoints.predict import to_risk_band


def test_to_risk_band_thresholds():
    assert to_risk_band(0.80) == "High"
    assert to_risk_band(0.50) == "Medium"
    assert to_risk_band(0.20) == "Low"
