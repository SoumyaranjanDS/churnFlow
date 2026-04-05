# Production Values

Use this guide to replace the placeholders in your production env files.

## Recommended topology

For the current repo, the cleanest deployment is:

- `web` behind your public app domain
- `api` behind your public API domain
- `ml-api` private inside Docker Compose
- MongoDB external or managed

That means:

- browser -> `https://app.your-domain.com`
- frontend calls -> `https://api.your-domain.com/api/v1`
- API calls ML API internally -> `http://ml-api:8001`

## Replace these values

### Public app domain

Replace:

```text
https://app.your-domain.com
```

With your real frontend domain, for example:

```text
https://app.churnflow.ai
```

Use it for:
- `FRONTEND_BASE_URL`

### Public API domain

Replace:

```text
https://api.your-domain.com
```

With your real API domain, for example:

```text
https://api.churnflow.ai
```

Use it for:
- `VITE_API_BASE_URL=https://api.your-domain.com/api/v1`
- `CORS_ORIGINS=https://app.your-domain.com,https://www.your-domain.com`

### Internal ML API URL

If you use the provided Docker Compose production setup, keep:

```text
ML_API_URL=http://ml-api:8001
```

Do not replace that with a public domain unless you are hosting `ml-api` separately.

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

These are the values I recommend if all app containers run together on one server:

```env
VITE_API_BASE_URL=https://api.your-domain.com/api/v1
MONGO_URI=mongodb+srv://username:password@cluster.example.mongodb.net/churn_platform
ML_API_URL=http://ml-api:8001
FRONTEND_BASE_URL=https://app.your-domain.com
CORS_ORIGINS=https://app.your-domain.com,https://www.your-domain.com
JWT_SECRET=replace_with_a_long_random_secret
GEMINI_API_KEY=replace_me
```

## Quick mapping table

| Variable | What it should point to |
| --- | --- |
| `VITE_API_BASE_URL` | Public API URL used by the browser |
| `FRONTEND_BASE_URL` | Public frontend URL used in emails |
| `ML_API_URL` | Internal ML API URL used by Node API |
| `CORS_ORIGINS` | Public frontend origins allowed to call API |
| `MONGO_URI` | Your database |
| `JWT_SECRET` | Private signing secret |
| `GEMINI_API_KEY` | Your Gemini API key |

## Best practice

For your current setup, use:

- public domains for `web` and `api`
- internal service URL for `ml-api`

That is the least confusing and best matches the current repo.
