# Phase 1 README

Phase 1 is the telecom MVP of Churn Platform.

The goal of this phase was simple:
- make one real telecom churn product work end to end
- keep the workflow understandable for non-technical users
- persist everything in MongoDB
- connect React -> Node -> FastAPI -> ML model cleanly

## Phase 1 Goal

Support a telecom business user who wants to:
1. add customer data
2. predict churn risk
3. review risky customers
4. create retention actions
5. record actual results later

## What Phase 1 Includes

### Frontend
- public landing site
- auth modal and protected workspace flow
- `Dashboard`
- `Customers`
- `Upload`
- `Analyze`
- `At-Risk`
- `Actions`
- `Results`

### Backend
- auth
- workspace-aware user sessions
- tenant-aware customer APIs
- telecom import APIs
- scoring APIs
- latest prediction APIs
- action APIs
- outcome APIs
- dashboard summary APIs

### ML
- IBM telecom-trained churn model
- FastAPI inference service
- single prediction
- batch prediction
- probability + risk band + explanation payload

### Database
- `users`
- `tenants`
- `tenantmemberships`
- `customers`
- `predictions`
- `retentionactions`
- `outcomes`

## Phase 1 Business Flow

### 1. User and workspace
- first user signs up
- user gets a telecom workspace
- older users without workspace are backfilled

### 2. Customer intake
- import telecom workbook from path
- upload telecom workbook
- create one customer manually
- inspect customers in the `Customers` page

### 3. Scoring
- analyze one customer by `customerId`
- run batch scoring for recent customers
- save prediction records in MongoDB

### 4. Queue and follow-up
- latest saved predictions feed the `At-Risk` queue
- queue items can create follow-up actions
- actions are saved to MongoDB

### 5. Results and outcomes
- `Results` page shows saved prediction results
- user can later record actual outcome
- outcome is linked to latest prediction/action when possible

## Workspace Navigation

Phase 1 workspace pages:
- `/app/dashboard`
- `/app/customers`
- `/app/upload`
- `/app/analyze`
- `/app/at-risk`
- `/app/actions`
- `/app/results`

## Telecom Input Contract

Business-facing required fields:
- `customerId`
- `tenureMonths`
- `monthlyCharges`
- `contract`
- `internetService`
- `techSupport`

Model-facing mapped fields:
- `tenure_months`
- `monthly_charges`
- `contract`
- `internet_service`
- `tech_support`

## Key Files

### Frontend
- `apps/web/src/App.jsx`
- `apps/web/src/pages/App/UploadCustomersPage.jsx`
- `apps/web/src/pages/App/CustomersPage.jsx`
- `apps/web/src/pages/App/AnalyzeCustomersPage.jsx`
- `apps/web/src/pages/App/AtRiskCustomersPage.jsx`
- `apps/web/src/pages/App/ActionCenterPage.jsx`
- `apps/web/src/pages/App/ResultsPage.jsx`

### Backend
- `apps/api/src/controllers/auth.controller.js`
- `apps/api/src/controllers/customer.controller.js`
- `apps/api/src/controllers/scoring.controller.js`
- `apps/api/src/controllers/action.controller.js`
- `apps/api/src/controllers/outcome.controller.js`
- `apps/api/src/controllers/dashboard.controller.js`
- `apps/api/src/services/customer.service.js`
- `apps/api/src/services/tenant.service.js`

### ML
- `services/ml-training/src/pipelines/train_pipeline.py`
- `services/ml-training/src/training/models.py`
- `services/ml-api/app/api/v1/endpoints/predict.py`

## Legacy Customer Note

Phase 1 introduced workspace-aware customer records.

Older imported customers in MongoDB were created before `tenantId` existed.

Current Phase 1 behavior:
- new customers are saved directly into the active workspace
- older legacy telecom customers can be claimed into the active workspace by exact `customerId`

This means:
- newly created customers show immediately
- older imported customers become visible when searched directly

## What Is Not Included In Phase 1

- non-telecom customer onboarding
- AI agent for dataset/schema analysis
- custom per-client training flow
- tenant-specific retraining
- model registry
- drift monitoring

Those belong to later phases.

## Phase 1 Exit Criteria

Phase 1 is considered complete when:
- user can sign up and log in
- customer data can be added or imported
- customer can be found in app and DB
- scoring works
- queue works
- action creation works
- results page shows saved predictions
- verified outcomes can be recorded

That state has now been reached.
