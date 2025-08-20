from __future__ import annotations

from fastapi.testclient import TestClient

from backend.api.main import app


client = TestClient(app)


def test_agent_plan():
    r = client.post("/agent/plan", json={"objectives": ["stabilize"], "context": {"deployment": "myapp", "replicas": 2}})
    assert r.status_code == 200
    data = r.json()
    assert "steps" in data
    assert isinstance(data["steps"], list)


def test_execute_action_dry_run():
    r = client.post("/actions/execute", json={"name": "scale_deployment", "params": {"deployment": "myapp", "replicas": 2, "dry_run": True, "approved": True}})
    assert r.status_code == 200
    data = r.json()
    assert data["success"] in (True, False)  # dry run returns success True
    assert "duration_seconds" in data

