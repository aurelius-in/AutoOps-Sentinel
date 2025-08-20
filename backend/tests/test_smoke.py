from __future__ import annotations

import json
from fastapi.testclient import TestClient

from backend.api.main import app


client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_metrics_and_anomalies_flow():
    # send some cpu metrics
    for i in range(6):
        r = client.post("/metrics", json={
            "source": "test",
            "metric": "cpu",
            "value": 30 + i,
            "tags": {},
        })
        assert r.status_code == 200
    r = client.get("/anomalies")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


