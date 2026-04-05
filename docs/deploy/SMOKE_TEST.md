# Smoke Test

Use this after deployment to confirm the stack is actually healthy.

## 1. Containers are up

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Expected:
- `web` is running
- `api` is running
- `ml-api` is running

## 2. ML API health

```powershell
curl http://localhost:8001/healthz
```

Expected:
- HTTP 200
- response contains `status: ok`

## 3. API health

```powershell
curl http://localhost:8000/api/v1/health
```

Expected:
- HTTP 200
- API healthy response

## 4. Web loads

Open:

```text
http://localhost:4173
```

Expected:
- landing page loads
- no blank screen

## 5. Signup flow

Test both:

1. telecom signup
2. custom signup

Expected:
- telecom path lands in dashboard flow
- custom path lands in custom setup flow

## 6. Login flow

Expected:
- user can sign in
- workspace navbar appears
- no redirect loop

## 7. Telecom scoring test

Expected:
- create a telecom customer
- score that customer
- result appears in Results

## 8. Custom flow test

Expected:
- upload sample dataset
- confirm custom setup
- start training
- deploy model
- create custom customer
- score custom customer

## 9. Email test

If email verification/reset is enabled:

- request password reset
- verify the reset email arrives
- complete the reset successfully

## 10. Logs check

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail 100 api
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail 100 ml-api
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail 100 web
```

Expected:
- no crash loop
- no missing env errors
- no ML API unreachable errors

## If something fails

### API health fails
- check `MONGO_URI`
- check `JWT_SECRET`
- check API logs

### Scoring fails
- check `ML_API_URL`
- check `ml-api` container health

### Custom training fails
- check Python logs in API container
- check mounted `services/ml-training`
- check shared training artifact volume

### Web loads but actions fail
- check `VITE_API_BASE_URL`
- check `CORS_ORIGINS`

## Final sign-off

You can consider the deploy healthy when:

1. all health checks pass
2. signup/login work
3. telecom scoring works
4. custom training and scoring work
5. email flow works if enabled
