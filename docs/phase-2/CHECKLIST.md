# Phase 2 Checklist

This checklist tracks the custom-industry onboarding phase.

Phase 2 goal:
- move beyond telecom-only workflows
- help non-telecom users upload their own data
- profile datasets safely
- suggest schema mappings
- define churn target candidates
- prepare tenants for future custom-model training

## Product Scope

- [x] Phase 2 is focused on custom onboarding, not full custom model deployment
- [x] Telecom Phase 1 flow remains unchanged
- [x] Phase 2 starts with schema/readiness analysis before AI agent orchestration
- [x] Gemini-assisted questioning is integrated

## Backend Foundation

- [x] onboarding route exists
- [x] onboarding controller exists
- [x] onboarding service exists
- [x] dataset profile model exists
- [x] tenant schema profile model exists
- [x] onboarding snapshot API exists
- [x] onboarding upload analysis API exists

## Dataset Intake

- [x] sample dataset upload works
- [x] uploaded workbook columns are detected
- [x] sample rows are stored
- [x] row count is stored
- [x] CSV parsing support is verified end to end
- [x] multiple sheet selection is supported

## Schema And Readiness Analysis

- [x] mapping suggestions are generated
- [x] suggested industry is generated
- [x] target label candidates are generated
- [x] telecom readiness score is generated
- [x] custom training readiness score is generated
- [x] next-step recommendations are generated
- [x] user can confirm mappings manually
- [x] user can confirm target label manually

## Frontend

- [x] Phase 2 workspace page exists
- [x] file upload UI exists
- [x] schema preview UI exists
- [x] mapping suggestion UI exists
- [x] readiness summary UI exists
- [x] next-step recommendation UI exists
- [x] manual mapping editor UI exists
- [x] target-label confirmation UI exists
- [x] onboarding progress state is shown as a multi-step flow

## Tenant Data Persistence

- [x] latest onboarding snapshot is saved per workspace
- [x] latest schema snapshot is saved per workspace
- [x] onboarding history view exists
- [x] multiple dataset profiles per tenant are manageable in UI

## AI Agent Layer

- [x] Gemini integration exists
- [x] AI asks follow-up business questions
- [x] AI explains missing fields in business language
- [x] AI proposes churn definition options
- [x] AI proposes field normalization strategy

## Readiness Outcomes

- [x] platform can say "ready for telecom prediction"
- [x] platform can say "ready for custom training"
- [x] platform can say "not ready yet"
- [x] platform can block invalid custom-training attempts cleanly
- [x] platform can surface exact missing fields before training

## Out Of Scope For Phase 2

- [ ] tenant-specific model training
- [ ] model registry
- [ ] deployment switching between tenant models
- [ ] drift monitoring
- [ ] automatic retraining

These remain Phase 3 items.

## Current Progress Note

Completed already in this repo:
- onboarding dataset upload
- saved dataset/schema profiling
- Gemini-backed business explanation
- manual schema confirmation flow
- training readiness and Phase 3 handoff preview
- custom onboarding screen in workspace

Phase 2 validation completed:
- backend syntax checks passed
- frontend production build passed
- live Gemini request passed
- CSV onboarding service test passed against local MongoDB
