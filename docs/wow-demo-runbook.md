# Wow Demo Runbook

1. Start services
```
docker compose -f deploy/docker-compose.yml up --build -d
```
2. Open API docs at `/docs` and frontend at `http://localhost:5173`.
3. Click "Run Wow Demo" in the Simulation panel.
4. Observe:
- Timeline turns red with anomalies, then actions appear.
- Business ticker increases.
- Narrative summarizes incidents and cost avoided.
5. Export report (PDF/JSON) via the Report buttons.

Screenshots:
- `docs/assets/dashboard.png` – Dashboard overview
- `docs/assets/timeline.png` – Timeline with anomalies and actions
- `docs/assets/report.png` – PDF report
