# Wow Demo Script

1. Start stack: `docker compose -f deploy/docker-compose.yml up --build`
2. Open FastAPI docs at `/docs` (`http://localhost:8000/docs`).
3. Run a simulator in another terminal:
   - `python -m backend.scripts.simulate error-storm`
   - `python -m backend.scripts.simulate cpu-spike`
4. Watch `/anomalies` populate.
5. Plan actions: `POST /agent/plan` with body `{ "objectives": ["stabilize"], "context": { "deployment": "myapp", "replicas": 2 } }`.
6. Execute: `POST /actions/execute` with `{ "name": "rollout_undo", "params": { "deployment": "myapp" } }` or `scale_deployment`.
7. Ask agent: `POST /agent/query` with `{ "question": "What incidents did we prevent today?" }`.
8. Optional: open the placeholder dashboard at `frontend/src/pages/Dashboard.tsx` for UI scaffolding.
