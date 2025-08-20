from __future__ import annotations

import asyncio
from collections import defaultdict
from datetime import datetime, timedelta
from statistics import mean, pstdev
from typing import Dict, List, Tuple

from sqlalchemy.orm import Session

from ..common.db import SessionLocal
from ..common import models
from ..common.ops import create_incident_if_needed
from .algorithms import rolling_zscore, isolation_forest_score


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


def _detect_score(values: List[float]) -> float | None:
    # Try IsolationForest first
    iso = isolation_forest_score(values)
    if iso is not None:
        return iso * 3.5  # scale to roughly align with z-score thresholds
    z = rolling_zscore(values)
    return z


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
            score = _detect_score(values)
            if score is None:
                continue
            incident = create_incident_if_needed(db, metric, _severity_from_score(float(score)))
            anomaly = models.Anomaly(
                metric=metric,
                score=float(score),
                severity=_severity_from_score(float(score)),
                details={
                    "latest": values[-1],
                    "mean": mean(values[:-1]) if len(values) > 1 else values[-1],
                    "n": len(values),
                    "method": "iforest" if isolation_forest_score(values) is not None else "rolling_zscore",
                },
                incident_id=incident.id if incident else None,
            )
            db.add(anomaly)
        db.commit()
    finally:
        db.close()


