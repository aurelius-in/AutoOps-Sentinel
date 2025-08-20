from __future__ import annotations

from datetime import datetime

from fastapi.testclient import TestClient

from backend.api.main import app


client = TestClient(app)


def test_policy_suggests_scale_on_cpu():
    # generate CPU > 90 for a short window to trigger simple rule
    for _ in range(10):
        client.post(
            "/metrics",
            json={
                "source": "test",
                "metric": "cpu",
                "value": 95.0,
                "timestamp": datetime.utcnow().isoformat(),
                "tags": {},
            },
        )
    r = client.get("/policies/suggest")
    assert r.status_code == 200
    suggestions = r.json()
    assert any(s.get("action") == "scale_deployment" for s in suggestions)


