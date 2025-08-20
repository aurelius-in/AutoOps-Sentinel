from __future__ import annotations

import asyncio
from collections import defaultdict
from datetime import datetime, timedelta
from statistics import mean, pstdev
from typing import Dict, List, Tuple

from sqlalchemy.orm import Session

from ..common.db import SessionLocal
from ..common import models


def _load_recent_metrics(db: Session, minutes: int = 15) -> Dict[str, List[Tuple[datetime, float]]]:
    cutoff = datetime.utcnow() - timedelta(minutes=minutes)
    q = (
        db.query(models.Event)
        .filter(models.Event.type == "metric")
        .filter(models.Event.created_at >= cutoff)
        .order_by(models.Event.created_at.asc())
        .all()
    )
    series: Dict[str, List[Tuple[datetime, float]]] = defaultdict(list)
    for e in q:
        payload = e.payload or {}
        metric = str(payload.get("metric"))
        value = float(payload.get("value", 0))
        ts = datetime.fromisoformat(payload.get("timestamp")) if payload.get("timestamp") else e.created_at
        series[metric].append((ts, value))
    return series


def _z_score_detect(values: List[float], last_k: int = 1, threshold: float = 3.0) -> float | None:
    if len(values) < 5:
        return None
    baseline = values[:-last_k] if last_k > 0 else values
    if len(baseline) < 3:
        return None
    mu = mean(baseline)
    sigma = pstdev(baseline) or 1e-6
    last_value = values[-1]
    z = (last_value - mu) / sigma
    return z if abs(z) >= threshold else None


def _severity_from_score(score: float) -> str:
    a = abs(score)
    if a >= 6:
        return "critical"
    if a >= 4:
        return "high"
    if a >= 3:
        return "medium"
    return "low"


async def run_detection_cycle() -> None:
    # run sync detection in a thread if needed; it's quick enough inline for demo
    db: Session = SessionLocal()
    try:
        series = _load_recent_metrics(db)
        for metric, points in series.items():
            values = [v for _, v in points]
            score = _z_score_detect(values)
            if score is None:
                continue
            anomaly = models.Anomaly(
                metric=metric,
                score=float(score),
                severity=_severity_from_score(float(score)),
                details={
                    "latest": values[-1],
                    "mean": mean(values[:-1]) if len(values) > 1 else values[-1],
                    "n": len(values),
                    "method": "rolling_zscore",
                },
            )
            db.add(anomaly)
        db.commit()
    finally:
        db.close()


