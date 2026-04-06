# Deploy Values Sheet

Use this sheet before your first real deployment. Copy the values into your real `.env.production` and service-level env files.

## Current Netlify + Render setup

For your current deployment, use these live public URLs.

### Public URLs

- Frontend app: `https://churnflow.netlify.app`
- API public base: `https://churnflow-1.onrender.com`
- ML API public base: `https://churnflow.onrender.com`

Because `api` and `ml-api` are deployed as separate Render services, the Node API should use the public ML API URL.

## Root `.env.production` values

Replace every placeholder below before deploy.

```env
# Web
VITE_API_BASE_URL=https://churnflow-1.onrender.com/api/v1
WEB_PORT=4173

# API
API_PORT=8000
MONGO_URI=mongodb+srv://username:password@cluster.example.mongodb.net/churn_platform
ML_API_URL=https://churnflow.onrender.com
ML_API_TIMEOUT_MS=12000
FRONTEND_BASE_URL=https://churnflow.netlify.app
CORS_ORIGINS=https://churnflow.netlify.app
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
JWT_ISSUER=churn-platform-api
AUTH_REQUIRE_EMAIL_VERIFICATION=true
EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=60
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
PASSWORD_RESET_TOKEN_TTL_MINUTES=30
PASSWORD_RESET_RESEND_COOLDOWN_SECONDS=60
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey_or_username
SMTP_PASS=replace_me
SMTP_FROM=ChurnFlow <no-reply@your-domain.com>
CONTACT_INBOX_EMAIL=support@your-domain.com
GEMINI_API_KEY=replace_me
GEMINI_MODEL=gemini-2.5-flash
ML_TRAINING_PYTHON_CMD=python
ML_TRAINING_SERVICE_DIR=/srv/churn-platform/services/ml-training
ML_TRAINING_SCRIPT_PATH=/srv/churn-platform/services/ml-training/src/pipelines/train_custom_tenant_pipeline.py
ML_TRAINING_ARTIFACTS_DIR=/srv/churn-platform/storage/training-artifacts
ML_TRAINING_TIMEOUT_MS=1200000
ONBOARDING_UPLOADS_DIR=/srv/churn-platform/storage/onboarding

# ML API
ML_API_PORT=8001
ML_API_REQUIRE_RELOAD_API_KEY=true
ML_API_RELOAD_API_KEY=replace_me
```

## Fill-this-first checklist

1. `MONGO_URI`
2. `JWT_SECRET`
3. `GEMINI_API_KEY`
4. `SMTP_HOST`
5. `SMTP_PORT`
6. `SMTP_USER`
7. `SMTP_PASS`
8. `SMTP_FROM`
9. `CONTACT_INBOX_EMAIL`
10. `VITE_API_BASE_URL`
11. `FRONTEND_BASE_URL`
12. `CORS_ORIGINS`
13. `ML_API_RELOAD_API_KEY`

## If you move services later

If you later move `api` and `ml-api` to the same Docker network, then `ML_API_URL` could switch to an internal service name like:

```env
ML_API_URL=http://ml-api:8001
```

But for your current deployment, keep `https://churnflow.onrender.com`.

## Final sanity checks

- `VITE_API_BASE_URL` points to the deployed API
- `ML_API_URL` matches your networking model
- `FRONTEND_BASE_URL` matches the real frontend origin
- `CORS_ORIGINS` includes every real frontend domain
- `JWT_SECRET` is long and unique
- `GEMINI_API_KEY` is rotated and valid
- SMTP values are real if verification/reset is enabled

## Related files

- `DEPLOY.md`
- `.env.production.example`
- `apps/api/.env.production.example`
- `apps/web/.env.production.example`
- `services/ml-api/.env.production.example`
