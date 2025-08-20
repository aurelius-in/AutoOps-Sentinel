# AutoOps Sentinel

Agentic AI-driven ops demo: ingest metrics, detect anomalies, plan actions, auto-remediate, and explain decisions.

## Quickstart

Prereqs: Docker, Docker Compose.

1. Start stack
   - `docker compose -f deploy/docker-compose.yml up --build`
2. Open API docs
   - `http://localhost:8000/docs`
3. Simulate incidents (in another shell)
   - CPU spike: `python -m backend.scripts.simulate cpu-spike`
   - Error storm: `python -m backend.scripts.simulate error-storm`
   - Login attack: `python -m backend.scripts.simulate login-attack`
   - Wow demo: `python -m backend.scripts.wow_demo --api http://localhost:8000`
4. Explore endpoints
   - `GET /anomalies` → detected anomalies
   - `POST /agent/plan` → suggested steps
   - `POST /actions/execute` → run a runbook (echo-simulated)

## Local dev (Python)

```
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.api.main:app --reload
```

## Notes
- Postgres runs in Docker with default creds `autoops:autoops`.
- Runbooks live under `runbooks/` and are echo-simulated for safety.
- Policy rules at `backend/policy/rules.yml`.
- Sensitive endpoints accept `X-API-Token` if `API_TOKEN` is set.

## Frontend via Docker Compose

Start both API and frontend with one command:

```
docker compose -f deploy/docker-compose.yml up --build -d
```

Then open `http://localhost:5173`.

More details: see `docs/deployment.md`.

## Docs
- Deployment: `docs/deployment.md`
- Wow Demo Runbook: `docs/wow-demo-runbook.md`
- Use cases: `docs/usecases.md`
