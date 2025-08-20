# Contributing

Thanks for your interest in AutoOps Sentinel! We welcome issues and PRs.

## Dev setup
- Python 3.12+
- Node 20+
- `pip install -r requirements.txt -r requirements-dev.txt`
- `cd frontend && npm install`

## Running
- Backend: `make dev` or `uvicorn backend.api.main:app --reload`
- Frontend: `cd frontend && npm run dev`
- Compose: `docker compose -f deploy/docker-compose.yml up --build -d`

## Tests
- `make test`

## Style
- Keep code readable and well-typed where applicable.
- Avoid unrelated formatting changes.

## PRs
- One focused change per PR.
- Include tests for behavior changes.
- Update docs/README when adding features.
