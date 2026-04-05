# API Testing Quick Guide

Base URL: `http://localhost:8000/api/v1`

## Swagger UI
- Docs UI: `http://localhost:8000/api/docs`
- OpenAPI JSON: `http://localhost:8000/api/openapi.json`

## 1) Register First User (becomes admin)
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@churn.com","password":"StrongPass123!"}'
```

## 2) Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@churn.com","password":"StrongPass123!"}'
```

Copy `data.token` from login response.

## 3) Access Protected Route
```bash
curl -X GET "http://localhost:8000/api/v1/customers?page=1&limit=10" \
  -H "Authorization: Bearer <TOKEN>"
```

## 4) Create Manager/Agent User (admin only)
```bash
curl -X POST http://localhost:8000/api/v1/auth/users \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Manager One","email":"manager@churn.com","password":"StrongPass123!","role":"manager"}'
```

## 5) Import Telco By Path (manager/admin)
```bash
curl -X POST http://localhost:8000/api/v1/import/telco/path \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"filePath":"C:/Users/soumy/Downloads/archive (2)/Telco_customer_churn.xlsx"}'
```

## 6) Score Customer
```bash
curl -X POST http://localhost:8000/api/v1/scoring/predict \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"customerId":"7590-VHVEG","threshold":0.5}'
```

## 6.1) Batch Score Customers (MVP Analyze step)
```bash
curl -X POST http://localhost:8000/api/v1/scoring/batch \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"limit":100,"threshold":0.5}'
```

## 6.2) Latest At-Risk Customers (MVP queue step)
```bash
curl -X GET "http://localhost:8000/api/v1/scoring/latest?page=1&limit=20&riskBand=High&minProbability=0.4" \
  -H "Authorization: Bearer <TOKEN>"
```

## 7) Record Outcome
```bash
curl -X POST http://localhost:8000/api/v1/outcomes \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"customerId":"7590-VHVEG","actualChurned":false,"retentionSuccessful":true,"notes":"Customer retained after support call"}'
```

## 8) Get Dashboard Summary
```bash
curl -X GET "http://localhost:8000/api/v1/dashboard/summary?days=30" \
  -H "Authorization: Bearer <TOKEN>"
```
