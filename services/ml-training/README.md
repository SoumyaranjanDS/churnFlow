# ML Training Service

This service trains the churn model and exports production artifacts for `services/ml-api`.

## 1) Setup

```bash
cd services/ml-training
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## 2) Train Model

Run training (default uses `churn-platform/ibm/Telco_customer_churn.xlsx`):

```bash
python -m src.pipelines.train_pipeline
```

Run training and also copy artifacts to FastAPI:

```bash
python -m src.pipelines.train_pipeline --export-to-ml-api
```

## 3) Outputs

Artifacts are generated in:

- `services/ml-training/artifacts/model_bundle.joblib`
- `services/ml-training/artifacts/metrics.json`
- `services/ml-training/artifacts/metadata.json`

With `--export-to-ml-api`, the same files are copied to:

- `services/ml-api/models/production/`

## 4) Feature Contract (Node -> FastAPI)

Model is trained and served on this request schema:

- `tenure_months`
- `monthly_charges`
- `contract`
- `internet_service`
- `tech_support`

This keeps inference contract stable with your Node backend.

## 5) EDA + Feature Engineering (Current Code)

Current training code improves baseline by adding churn-oriented engineered features:

- `tenure_log1p`, `monthly_log1p`
- `charges_per_tenure`, `tenure_x_monthly`
- `is_month_to_month`, `is_long_contract`
- `is_fiber`, `no_tech_support`, `fiber_and_no_support`
- `high_charge_low_tenure`

Feature engineering code: `src/features/feature_engineering.py`

EDA-informed assumptions used:

- month-to-month + fiber + no tech support is higher risk
- short tenure + high monthly charge is higher risk
- long contract reduces risk

## 6) Selection and Threshold

- Candidate models: logistic regression, random forest, extra trees
- Best model is selected using `--selection-metric` (default `f1`)
- Decision threshold is tuned on validation split and stored in `metadata.json`
- `metrics.json` includes confusion matrix and exact `fpr/fnr/tnr/npv` for each evaluated model

## 7) Recommended Production Cadence

1. Retrain monthly or when data drift is detected.
2. Compare new `metrics.json` with previous model.
3. Promote model to `ml-api/models/production` only if it improves your chosen KPI.
4. Tag model version and keep rollback artifacts.

## 8) Reload Model Without Restart

After copying new artifacts to `services/ml-api/models/production`, call:

```bash
curl -X POST http://localhost:8001/v1/reload-model
```

Then verify:

```bash
curl http://localhost:8001/v1/model-info
```

If reload key protection is enabled, pass header:

```bash
curl -X POST http://localhost:8001/v1/reload-model -H "x-reload-api-key: <your-secret-key>"
```

## 9) Notebook Template

Use this notebook for production-aligned experimentation:

- `services/ml-training/notebooks/01_telco_churn_production_template.ipynb`

## 10) Test Suite

```bash
cd services/ml-training
PYTHONPATH=. pytest -q
```

## 11) Frozen V1 Baseline Notes

V1 is kept as documentation only (not separate code path):

- `services/ml-training/docs/v1_baseline.md`
