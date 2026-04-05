# Phase 1 Checklist

This checklist tracks the telecom MVP only.

## Product Scope

- [x] Phase 1 is limited to telecom businesses
- [x] IBM telecom dataset is the baseline training source
- [x] Node backend is the main application backend
- [x] FastAPI is used only for ML inference
- [x] React frontend is the product UI

## Auth And Workspace

- [x] user registration works
- [x] login works
- [x] email verification flow exists
- [x] tenant/workspace model exists
- [x] first user gets a telecom workspace
- [x] legacy users without workspace are backfilled

## Customer Data

- [x] manual customer creation works
- [x] workbook import from path works
- [x] workbook upload import works
- [x] customer records are saved in MongoDB
- [x] customer database page exists
- [x] customer search works for workspace customers
- [x] exact `customerId` lookup can claim legacy customers into workspace
- [x] customer editing works for main telecom fields

## Scoring

- [x] single customer scoring works
- [x] batch scoring works
- [x] predictions are saved in MongoDB
- [x] prediction result includes probability
- [x] prediction result includes risk band
- [x] prediction result includes label
- [x] prediction result includes explanation

## Queue And Actions

- [x] at-risk queue page exists
- [x] queue reads latest saved predictions
- [x] queue filters work
- [x] follow-up action creation works
- [x] actions are saved in MongoDB
- [x] recent actions appear in app

## Results And Outcomes

- [x] results page exists
- [x] results page shows saved prediction results
- [x] outcome form exists
- [x] verified outcomes are saved in MongoDB
- [x] outcomes can link to latest prediction/action automatically

## Frontend UX

- [x] protected workspace shell exists
- [x] public navbar is visible across the app
- [x] mobile navigation exists
- [x] session context is carried between app tabs
- [x] latest customer ID is reused across screens
- [x] customer can move from upload -> analyze -> queue -> actions -> results

## ML And Data

- [x] training pipeline exists
- [x] model artifacts are exported
- [x] FastAPI can load model artifacts
- [x] Node API calls FastAPI for prediction
- [x] telecom feature engineering exists
- [x] metrics artifact is generated

## Database

- [x] `users` collection is used
- [x] `tenants` collection is used
- [x] `tenantmemberships` collection is used
- [x] `customers` collection is used
- [x] `predictions` collection is used
- [x] `retentionactions` collection is used
- [x] `outcomes` collection is used

## Validation

- [x] customer save flow was validated against MongoDB
- [x] prediction save flow was validated against MongoDB
- [x] action save flow was validated against MongoDB
- [x] outcome save flow was validated against MongoDB
- [x] frontend production build passes

## Out Of Scope For Phase 1

- [ ] custom non-telecom onboarding
- [ ] AI schema agent
- [ ] custom industry training pipeline
- [ ] tenant-specific retraining
- [ ] model registry
- [ ] drift monitoring

These unchecked items are intentionally deferred to Phase 2 and Phase 3.
