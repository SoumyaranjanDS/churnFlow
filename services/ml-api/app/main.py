from fastapi import FastAPI

from app.api.v1.endpoints.predict import router as inference_router

app = FastAPI(
    title="churn-ml-inference-service",
    version="0.2.0",
    description="ML-only inference service for churn prediction.",
)

app.include_router(inference_router, prefix="/v1", tags=["inference"])


@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "ml-inference"}
