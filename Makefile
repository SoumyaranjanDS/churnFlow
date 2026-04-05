.PHONY: up down web api mlapi

up:
	docker compose -f docker-compose.local.yml up --build

down:
	docker compose -f docker-compose.local.yml down

web:
	cd apps/web && npm run dev

api:
	cd apps/api && npm run dev

mlapi:
	cd services/ml-api && uvicorn app.main:app --reload --port 8001
