# Churn Platform

Telecom-focused churn prediction platform built as a MERN + FastAPI monorepo.

Deployment guide:
- [DEPLOY.md](C:/Users/soumy/OneDrive/Desktop/churnProject/churn-platform/DEPLOY.md)
- [Production Values](C:/Users/soumy/OneDrive/Desktop/churnProject/churn-platform/docs/deploy/PRODUCTION_VALUES.md)
- [Smoke Test](C:/Users/soumy/OneDrive/Desktop/churnProject/churn-platform/docs/deploy/SMOKE_TEST.md)

Phase 1 is now implemented as a working telecom MVP:
- React frontend for business users
- Node/Express application backend
- FastAPI ML inference service
- Python training pipeline for the churn model

## Current Status

- `Phase 1`: complete for telecom MVP
- `Phase 2`: complete for custom dataset onboarding, Gemini-assisted setup, and readiness checks
- `Phase 3`: complete for custom training, deployment tracking, and deployed-model scoring flow

Current platform capabilities:
- auth and workspace creation
- telecom customer import and manual entry
- customer database page
- single and batch churn scoring
- at-risk queue
- follow-up action center
- results page with scored predictions
- verified outcome recording
- MongoDB persistence
- legacy customer lookup by exact `customerId`

## Product Scope

This project currently supports:
- telecom businesses using the starter telco model
- non-telecom businesses using custom dataset onboarding and model training
- non-technical business users who need a clear workflow:
  - add customers
  - score churn risk
  - review at-risk customers
  - assign actions
  - record outcomes
  - onboard a custom dataset
  - train and deploy a custom model

Important remaining production-hardening work:
- background worker / queue isolation for training jobs
- cloud object storage for uploads and model artifacts
- stronger observability, alerts, and rollback tooling
- fuller automated test coverage
## Architecture

```text
React Web App
    ->
Node / Express API
    ->
FastAPI ML Inference
    ->
Trained churn model artifacts

MongoDB stores:
- users
- tenants
- tenant memberships
- customers
- predictions
- retention actions
- outcomes
```

## Services

### `apps/web`
- React + Vite frontend
- default local port: `5173`

### `apps/api`
- Node + Express application backend
- auth, customers, scoring workflow, actions, outcomes, dashboard
- default local port: `8000`

### `services/ml-api`
- FastAPI inference service only



