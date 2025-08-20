from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from . import models


def create_incident_if_needed(db: Session, metric: str, severity: str) -> Optional[models.Incident]:
    if severity not in {"high", "critical"}:
        return None
    cutoff = datetime.utcnow() - timedelta(minutes=30)
    existing = (
        db.query(models.Incident)
        .filter(models.Incident.status == "open")
        .filter(models.Incident.title.ilike(f"%{metric}%"))
        .filter(models.Incident.created_at >= cutoff)
        .first()
    )
    if existing:
        return existing
    incident = models.Incident(title=f"Incident: {metric} spike", status="open", metadata={"metric": metric})
    db.add(incident)
    db.flush()
    return incident


def mitigate_incidents_for_action(db: Session, action_name: str) -> int:
    metric_map = {
        "rollout_undo": "error_rate",
        "scale_deployment": "cpu",
        "restart_service": "latency",
    }
    metric = metric_map.get(action_name)
    if not metric:
        return 0
    open_incidents = (
        db.query(models.Incident)
        .filter(models.Incident.status == "open")
        .filter(models.Incident.title.ilike(f"%{metric}%"))
        .all()
    )
    count = 0
    for inc in open_incidents:
        inc.status = "mitigated"
        count += 1
    return count


