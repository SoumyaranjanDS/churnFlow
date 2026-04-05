from app.inference.model_store import load_artifacts


def test_load_artifacts_has_required_keys():
    artifacts = load_artifacts()

    for key in ["loaded", "model", "metadata", "metrics", "model_version", "threshold", "reason"]:
        assert key in artifacts
