# V1 Baseline (Frozen Reference)

This document records the historical V1 baseline so we remember what we started with.

## Model and Data

- model: `logistic_regression`
- dataset used in run: `C:\Users\soumy\Downloads\archive (2)\Telco_customer_churn.xlsx`
- dataset location now in project: `churn-platform/ibm/Telco_customer_churn.xlsx`
- trained_at_utc: `2026-04-05T07:26:05+00:00`
- feature contract: `tenure_months`, `monthly_charges`, `contract`, `internet_service`, `tech_support`

## V1 EDA + Feature Notes

V1 used only the API contract features above. It did not include engineered interaction features.

Observed patterns from baseline EDA:

- churn is higher for `month-to-month`
- churn is higher with `fiber optic` plus `no tech support`
- low tenure cohorts show stronger churn tendency
- high monthly charge cohorts churn more often than low monthly charge cohorts

## V1 Metrics

### Validation

- f1: `0.6361`
- precision: `0.5472`
- recall: `0.7594`
- roc_auc: `0.8256`
- pr_auc: `0.6224`
- fpr: `0.2271`

### Test

- f1: `0.6211`
- precision: `0.5347`
- recall: `0.7406`
- roc_auc: `0.8320`
- pr_auc: `0.6326`
- fpr: `0.2329`

## Notes

- V1 code path is intentionally retired from separate maintenance.
- Current active training code is `src/pipelines/train_pipeline.py` with improved feature engineering.
