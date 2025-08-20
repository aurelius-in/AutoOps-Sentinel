from __future__ import annotations

import argparse
import math
import random
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

from sqlalchemy.orm import Session

from ..common.db import SessionLocal
from ..common import models
from ..common.metrics_store import write_metric_influx


def _randn(scale: float = 1.0) -> float:
    # simple gaussian-like noise
    return scale * (random.random() - 0.5) * 2


def _times(now: datetime, minutes: int, step_seconds: int) -> List[datetime]:
    start = now - timedelta(minutes=minutes)
    t = start
    out: List[datetime] = []
    while t <= now:
        out.append(t)
        t += timedelta(seconds=step_seconds)
    return out


def generate_realistic_series(now: datetime) -> Dict[str, List[Tuple[datetime, float]]]:
    series: Dict[str, List[Tuple[datetime, float]]] = {"cpu": [], "mem": [], "latency": [], "error_rate": [], "failed_logins": []}
    ts = _times(now, minutes=120, step_seconds=30)

    # baseline curves
    for i, t in enumerate(ts):
        # diurnal-ish CPU baseline 30-45% with noise
        cpu_base = 35 + 7 * math.sin(i / 40) + _randn(2)
        # memory slow drift up 50-65%
        mem_base = 55 + (i / len(ts)) * 8 + _randn(1)
        # latency base 120ms
        lat_base = 120 + 10 * math.sin(i / 50) + _randn(8)
        # errors base ~0.5%
        err_base = max(0.0, 0.6 + _randn(0.2))
        # logins base 1-2/min
        login_base = max(0.0, 1.5 + _randn(0.8))

        series["cpu"].append((t, max(0.0, min(98.0, cpu_base))))
        series["mem"].append((t, max(0.0, min(98.0, mem_base))))
        series["latency"].append((t, max(20.0, lat_base)))
        series["error_rate"].append((t, err_base))
        series["failed_logins"].append((t, login_base))

    # inject incidents
    def apply_window(metric: str, start_min: int, end_min: int, value_fn):
        start_t = now - timedelta(minutes=start_min)
        end_t = now - timedelta(minutes=end_min)
        updated: List[Tuple[datetime, float]] = []
        for t, v in series[metric]:
            if start_t <= t <= end_t:
                updated.append((t, value_fn(t, v)))
            else:
                updated.append((t, v))
        series[metric] = updated

    # Error storm around 50-45 mins ago: error_rate 12-18%, latency 700-900ms
    apply_window("error_rate", 50, 45, lambda t, v: 12 + abs(_randn(3)))
    apply_window("latency", 50, 45, lambda t, v: 750 + abs(_randn(120)))

    # CPU spike around 35-25 mins ago: CPU 85-95%
    apply_window("cpu", 35, 25, lambda t, v: 86 + abs(_randn(6)))

    # Login attack around 28-24 mins ago
    apply_window("failed_logins", 28, 24, lambda t, v: 25 + abs(_randn(7)))

    return series


def seed(db: Session, realistic: bool = True, also_influx: bool = True) -> None:
    now = datetime.utcnow()

    if realistic:
        series = generate_realistic_series(now)
    else:
        # minimal seed
        series = {
            "cpu": [(now - timedelta(minutes=i), 30 + _randn(3)) for i in range(30)],
            "mem": [(now - timedelta(minutes=i), 60 + _randn(2)) for i in range(30)],
            "latency": [(now - timedelta(minutes=i), 120 + _randn(10)) for i in range(30)],
            "error_rate": [(now - timedelta(minutes=i), max(0.0, 0.5 + _randn(0.2))) for i in range(30)],
            "failed_logins": [(now - timedelta(minutes=i), max(0.0, 1.0 + _randn(0.5))) for i in range(30)],
        }

    # write metrics as events
    for metric, points in series.items():
        for t, v in points:
            evt = models.Event(source="seed", type="metric", payload={"metric": metric, "value": float(v), "timestamp": t.isoformat(), "tags": {"env": "demo"}})
            db.add(evt)
            if also_influx:
                try:
                    write_metric_influx(metric, float(v), {"env": "demo"}, t)
                except Exception:
                    pass
    db.commit()

    # create indicative incidents and actions to tell the story
    inc_err = models.Incident(title="Incident: error_rate spike", status="mitigated", impact_minutes=6, metadata={"metric": "error_rate"})
    inc_cpu = models.Incident(title="Incident: cpu spike", status="mitigated", impact_minutes=10, metadata={"metric": "cpu"})
    db.add(inc_err)
    db.add(inc_cpu)
    db.commit()

    act_rollback = models.Action(name="rollout_undo", input={"deployment": "myapp"}, result={"success": True, "logs": "kubectl rollout undo ...\nstatus: complete"}, success=True)
    act_scale = models.Action(name="scale_deployment", input={"deployment": "myapp", "replicas": 3}, result={"success": True, "logs": "kubectl scale deployment/myapp --replicas=3"}, success=True)
    db.add(act_rollback)
    db.add(act_scale)
    db.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed realistic demo data into the local datastore")
    parser.add_argument("--reset", action="store_true", help="reset DB tables before seeding")
    parser.add_argument("--minimal", action="store_true", help="seed minimal dataset instead of full realistic")
    parser.add_argument("--no-influx", action="store_true", help="do not write to InfluxDB even if configured")
    args = parser.parse_args()

    db: Session = SessionLocal()
    try:
        if args.reset:
            db.query(models.Action).delete()
            db.query(models.Anomaly).delete()
            db.query(models.Incident).delete()
            db.query(models.Event).delete()
            db.commit()
        seed(db, realistic=not args.minimal, also_influx=not args.no_influx)
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    main()


