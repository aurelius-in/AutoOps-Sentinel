# Deployment Guide

## Docker Compose (Demo)

Prereqs: Docker Desktop

1. Set optional environment variables (PowerShell):
   - `$env:API_TOKEN="devtoken"`
   - `$env:OPENAI_API_KEY="sk-..."` (optional)

2. Start services:
```
docker compose -f deploy/docker-compose.yml up --build -d
```

3. Access:
- API: http://localhost:8000 (docs at /docs)
- Frontend: http://localhost:5173

Note: Protected endpoints require header `X-API-Token: <your token>` if `API_TOKEN` is set.

## Kubernetes (basic)

Apply manifests (requires an ingress controller and DNS or hosts mapping):
```
kubectl apply -f deploy/k8s/api-deployment.yaml
kubectl apply -f deploy/k8s/api-service.yaml
kubectl apply -f deploy/k8s/frontend-deployment.yaml
kubectl apply -f deploy/k8s/frontend-service.yaml
kubectl apply -f deploy/k8s/ingress.yaml
```

Then map `autoops.local` to your ingress IP (e.g., via hosts file) and open:
- Frontend: http://autoops.local/
- API: http://autoops.local/api

## Environment Variables

- `API_TOKEN`: optional token to protect sensitive endpoints
- `OPENAI_API_KEY`: optional for agent narratives
- `CORS_ORIGINS`: comma-separated origins (default `*`)
- `AUTO_APPLY_POLICIES`: `1` to enable policy auto-apply loop (default `0`)
- `POLICY_CHECK_INTERVAL_SECONDS`: interval for policy loop (default `15`)
- `WEBHOOK_URL`: optional webhook for high/critical anomalies
- `DATABASE_URL`: default `sqlite:///autoops.db`
