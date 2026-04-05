from fastapi.testclient import TestClient

from app.core.settings import get_settings
from app.inference.model_store import load_artifacts
from app.main import app


def test_model_info_endpoint():
    client = TestClient(app)
    response = client.get("/v1/model-info")

    assert response.status_code == 200
    body = response.json()
    assert "model_version" in body
    assert "model_loaded" in body


def test_healthz_endpoint():
    client = TestClient(app)
    response = client.get("/healthz")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_reload_requires_key_when_enabled(monkeypatch):
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("ML_API_REQUIRE_RELOAD_API_KEY", "true")
    monkeypatch.setenv("ML_API_RELOAD_API_KEY", "secret-key")
    get_settings.cache_clear()
    load_artifacts.cache_clear()

    client = TestClient(app)

    unauthorized = client.post("/v1/reload-model")
    assert unauthorized.status_code == 401

    authorized = client.post("/v1/reload-model", headers={"x-reload-api-key": "secret-key"})
    assert authorized.status_code == 200
    payload = authorized.json()
    assert payload["success"] is True

    # Keep test isolation clean.
    monkeypatch.delenv("ML_API_REQUIRE_RELOAD_API_KEY", raising=False)
    monkeypatch.delenv("ML_API_RELOAD_API_KEY", raising=False)
    get_settings.cache_clear()
