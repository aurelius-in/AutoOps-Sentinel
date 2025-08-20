from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from ruamel.yaml import YAML
from sqlalchemy.orm import Session

from ..common import models


yaml = YAML(typ="safe")


@dataclass
class Rule:
    condition: str
    action: str


def load_rules(path: str = "backend/policy/rules.yml") -> List[Rule]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.load(f) or []
    except FileNotFoundError:
        data = []
    rules: List[Rule] = []
    for item in data:
        rules.append(Rule(condition=str(item.get("condition")), action=str(item.get("action"))))
    return rules


_COND_RE = re.compile(r"^(?P<metric>\w+)\s*>\s*(?P<threshold>\d+)(?P<pct>%?)\s*(?:for\s*(?P<minutes>\d+)m)?$")


def _metric_value(db: Session, metric: str, minutes: int | None) -> Optional[float]:
    q = db.query(models.Event).filter(models.Event.type == "metric")
    if minutes:
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)
        q = q.filter(models.Event.created_at >= cutoff)
    q = q.order_by(models.Event.created_at.desc()).limit(20)
    values: List[float] = []
    for e in q:
        payload = e.payload or {}
        if str(payload.get("metric")) != metric:
            continue
        values.append(float(payload.get("value", 0)))
    if not values:
        return None
    # use average for windowed conditions; else latest
    if minutes:
        return sum(values) / len(values)
    return values[0]


def evaluate_policies(db: Session) -> List[Dict[str, str]]:
    """Return suggested actions based on simple YAML rules."""
    suggestions: List[Dict[str, str]] = []
    for rule in load_rules():
        m = _COND_RE.match(rule.condition.strip())
        if not m:
            continue
        metric = m.group("metric")
        threshold_raw = m.group("threshold")
        is_pct = bool(m.group("pct"))
        minutes = int(m.group("minutes")) if m.group("minutes") else None
        value = _metric_value(db, metric, minutes)
        if value is None:
            continue
        threshold = float(threshold_raw)
        if is_pct:
            # assume values already are percentages (0-100)
            pass
        if value > threshold:
            suggestions.append({"action": rule.action, "reason": rule.condition})
    return suggestions


