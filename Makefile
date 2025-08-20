.PHONY: dev api frontend test lint migrate

dev:
	uvicorn backend.api.main:app --reload

api:
	docker compose -f deploy/docker-compose.yml up --build -d api

frontend:
	cd frontend && npm install && npm run dev

test:
	pytest -q

migrate:
	alembic -c backend/alembic.ini upgrade head


