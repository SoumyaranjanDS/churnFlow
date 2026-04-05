Integration tests for `apps/api` should validate:

- auth-protected route behavior
- Mongo-backed controllers
- ML API integration fallback behavior

These are intentionally separated from ML service tests under `services/ml-api/tests`.
