# Deploy Values Sheet

Use this sheet before your first real deployment. Copy the values into your real `.env.production` and service-level env files.

## Recommended single-host Docker Compose setup

If you are deploying the current stack with `docker-compose.prod.yml` on one server, use these patterns.

### Public URLs

- Frontend app: `https://app.your-domain.com`
- Marketing/public site: `https://www.your-domain.com`
- API public base: `https://api.your-domain.com`

### Internal service URLs

- API -> ML API: `http://ml-api:8001`

Do not use the public ML API URL inside the API container when both services run in the same Docker Compose stack. Use the internal Docker service name instead.

## Root `.env.production` values

Replace every placeholder below before deploy.

```env
# Web
VITE_API_BASE_URL=https://api.your-domain.com/api/v1
WEB_PORT=4173

# API
API_PORT=8000
MONGO_URI=mongodb+srv://username:password@cluster.example.mongodb.net/churn_platform
ML_API_URL=http://ml-api:8001
ML_API_TIMEOUT_MS=12000
FRONTEND_BASE_URL=https://app.your-domain.com
CORS_ORIGINS=https://app.your-domain.com,https://www.your-domain.com
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

## If you deploy services separately

If `api` and `ml-api` are not on the same Docker network, then `ML_API_URL` should point to the reachable internal or public URL for the ML API, for example:

```env
ML_API_URL=https://ml-api.your-domain.com
```

Only use that version when the API container cannot resolve `http://ml-api:8001`.

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
