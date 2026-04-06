# Production Values

Use this guide to replace the placeholders in your production env files.

## Recommended topology

For the current repo, the cleanest deployment is:

- `web` behind your public app domain
- `api` behind your public API domain
- `ml-api` as a separate service
- MongoDB external or managed

That means:

- browser -> `https://churnflow.netlify.app`
- frontend calls -> `https://churnflow-1.onrender.com/api/v1`
- API calls ML API -> `https://churnflow.onrender.com`

## Replace these values

### Public app domain

Replace:

```text
https://churnflow.netlify.app
```

Use it for:
- `FRONTEND_BASE_URL`

### Public API domain

Replace:

```text
https://churnflow-1.onrender.com
```

Use it for:
- `VITE_API_BASE_URL=https://churnflow-1.onrender.com/api/v1`
- `CORS_ORIGINS=https://churnflow.netlify.app`

### ML API URL

For your current Render deployment, use:

```text
ML_API_URL=https://churnflow.onrender.com
```

Do not use `http://ml-api:8001` for Render because your Node API and ML API are deployed as separate services.

### Mongo URI

Replace:

```text
mongodb+srv://username:password@cluster.example.mongodb.net/churn_platform
```

With your real database connection string.

### JWT secret

Replace:

```text
replace_with_a_long_random_secret
```

With a strong random value. Use at least 32 characters.

### Gemini key

Replace:

```text
replace_me
```

With your real Gemini key.

Important:
- rotate any key that was previously shared in chat
- never commit the real value

### SMTP values

If email verification/reset is enabled:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `CONTACT_INBOX_EMAIL`

must all be real.

If email verification is disabled:
- SMTP can stay empty

## Single-server Docker Compose example

These are the values I recommend for your current Netlify + Render deployment:

```env
VITE_API_BASE_URL=https://churnflow-1.onrender.com/api/v1
MONGO_URI=mongodb+srv://username:password@cluster.example.mongodb.net/churn_platform
ML_API_URL=https://churnflow.onrender.com
FRONTEND_BASE_URL=https://churnflow.netlify.app
CORS_ORIGINS=https://churnflow.netlify.app
JWT_SECRET=replace_with_a_long_random_secret
GEMINI_API_KEY=replace_me
```

## Quick mapping table

| Variable | What it should point to |
| --- | --- |
| `VITE_API_BASE_URL` | Public API URL used by the browser |
| `FRONTEND_BASE_URL` | Public frontend URL used in emails |
| `ML_API_URL` | Public ML API URL used by Node API |
| `CORS_ORIGINS` | Public frontend origins allowed to call API |
| `MONGO_URI` | Your database |
| `JWT_SECRET` | Private signing secret |
| `GEMINI_API_KEY` | Your Gemini API key |

## Best practice

For your current setup, use:

- public Netlify URL for `web`
- public Render URL for `api`
- public Render URL for `ml-api`

That is the least confusing and best matches your current deployment.
