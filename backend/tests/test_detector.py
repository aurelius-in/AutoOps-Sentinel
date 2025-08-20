from __future__ import annotations

import asyncio
from datetime import datetime

from fastapi.testclient import TestClient

from backend.api.main import app
from backend.detector.detector import run_detection_cycle


client = TestClient(app)


async def _send_cpu_series(n: int = 10, base: float = 20.0, spike: float = 95.0):
    # send baseline
    for i in range(n - 1):
        client.post("/metrics", json={
            "source": "test",
            "metric": "cpu",
            "value": base + i * 0.1,
            "timestamp": datetime.utcnow().isoformat(),
            "tags": {},
        })
    # send spike
    client.post("/metrics", json={
        "source": "test",
        "metric": "cpu",
        "value": spike,
        "timestamp": datetime.utcnow().isoformat(),
        "tags": {},
    })


def test_detector_creates_anomaly():
    asyncio.get_event_loop().run_until_complete(_send_cpu_series())
    asyncio.get_event_loop().run_until_complete(run_detection_cycle())
    r = client.get("/anomalies")
    assert r.status_code == 200
    anomalies = r.json()
    assert isinstance(anomalies, list)
    # expect at least one anomaly for cpu
    assert any(a.get("metric") == "cpu" for a in anomalies)


