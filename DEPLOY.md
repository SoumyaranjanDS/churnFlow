# Deploy Guide

This guide is the shortest safe path to deploy the current Churn Platform stack without changing code.

## What must exist before deploy

1.  A reachable MongoDB instance
2.  Docker and Docker Compose on the target machine
3.  Real values for:
    -   `MONGO_URI`
    -   `ML_API_URL`
    -   `FRONTEND_BASE_URL`
    -   `CORS_ORIGINS`
    -   `JWT_SECRET`
    -   `GEMINI_API_KEY`
    -   SMTP values if email verification/reset will be used

## Files to use

-   Root production env template:
    -   [.env.production.example](C:/Users/soumy/OneDrive/Desktop/churnProject/churn-platform/.env.production.example)
-   Deployment values sheet:
    -   [DEPLOY_VALUES.md](C:/Users/soumy/OneDrive/Desktop/churnProject/churn-platform/DEPLOY_VALUES.md)
-   API env examples:
    -   [apps/api/.env.example](C:/Users/soumy/OneDrive/Desktop/churnProject/churn-platform/apps/api/.env.example)
    -   [apps/api/.env.production.example](C:/Users/soumy/OneDrive/Desktop/churnProject/churn-platform/apps/api/.env.production.example)`​`
-   Web env examples:
    -   [apps/web/.env.example](C:/Users/soumy/OneDrive/Desktop/churnProject/churn-platform/apps/web/.env.example)
    -   [apps/web/.env.production.example](C:/Users/soumy/OneDrive/Desktop/churnProject/churn-platform/apps/web/.env.production.example)
-   ML API env example:
    -   [services/ml-api/.env.production.example](C:/Users/soumy/OneDrive/Desktop/churnProject/churn-platform/services/ml-api/.env.production.example)

## Recommended deploy order

1.  Prepare the production env file
2.  Make sure MongoDB is reachable
3.  Build images
4.  Start `ml-api`
5.  Start `api`
6.  Start `web`
7.  Run health checks

## Step 1: Create the production env file

From the repo root:

```powershell
Copy-Item .env.production.example .env.production
```

Then fill in the real values inside `.env.production`.

Important:

-   do not commit `.env.production`
-   rotate any previously shared Gemini key before real deploy

## Step 2: Confirm MongoDB is ready

The production compose file expects an external database through `MONGO_URI`.

Make sure:

-   the database exists
-   the server can reach it
-   the credentials are correct

## Step 3: Build images

From the repo root:

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml build
```

## Step 4: Start the ML API first

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml up -d ml-api
```

Health check:

```powershell
curl http://localhost:8001/healthz
```

## Step 5: Start the Node API

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml up -d api
```

Health check:

```powershell
curl http://localhost:8000/api/v1/health
```

## Step 6: Start the web app

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml up -d web
```

Open:

```text
http://localhost:4173
```

## Step 7: Check container status

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

## Full start command

If you already trust the env file and just want to bring everything up:

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## Logs

```powershell
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f ml-apidocker compose --env-file .env.production -f docker-compose.prod.yml logs -f apidocker compose --env-file .env.production -f docker-compose.prod.yml logs -f web
```

## What the production compose file already handles

-   web build-time API URL
-   API runtime envs
-   ML API runtime envs
-   shared onboarding storage volume
-   shared training artifact volume
-   shared `services/ml-training` mount for custom training jobs

## Local Docker stack

If you want the local Docker stack instead of manual local processes:

```powershell
docker compose -f docker-compose.local.yml builddocker compose -f docker-compose.local.yml up -d mongo ml-api api web
```

Local URLs:

-   Web: `http://localhost:5173`
-   API: `http://localhost:8000`
-   ML API: `http://localhost:8001`

## Common failure points

### Web loads but API calls fail

Check:

-   `VITE_API_BASE_URL`
-   API container is up
-   CORS includes the real frontend origin

### API starts but scoring fails

Check:

-   `ML_API_URL`
-   ML API container is healthy

### Custom training fails

Check:

-   `ML_TRAINING_PYTHON_CMD`
-   shared training artifact volume exists
-   `services/ml-training` is mounted into the API container

### Auth works locally but not in deploy

Check:

-   `JWT_SECRET`
-   `FRONTEND_BASE_URL`
-   SMTP values if verification/reset is enabled

## Minimum go-live checklist

1.  Fill `.env.production`
2.  Rotate secrets
3.  Build images
4.  Start `ml-api`
5.  Start `api`
6.  Start `web`
7.  Run health checks
8.  Test one login
9.  Test one prediction
10.  Test one custom training job if Phase 3 is being used