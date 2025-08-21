from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text, Boolean
from sqlalchemy.orm import relationship

from .db import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String(128), nullable=False)
    type = Column(String(64), nullable=False)  # metric | log | security
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    metric = Column(String(64), nullable=False)  # cpu | mem | latency | error_rate
    score = Column(Float, nullable=False)
    severity = Column(String(16), nullable=False)  # low | medium | high | critical
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    incident_id = Column(String(36), ForeignKey("incidents.id"), nullable=True)


class Runbook(Base):
    __tablename__ = "runbooks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(128), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    path = Column(String(256), nullable=False)  # relative path to YAML
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Action(Base):
    __tablename__ = "actions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(128), nullable=False)
    runbook_id = Column(String(36), ForeignKey("runbooks.id"), nullable=True)
    input = Column(JSON, nullable=True)
    result = Column(JSON, nullable=True)
    success = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    runbook = relationship("Runbook")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(256), nullable=False)
    status = Column(String(32), nullable=False, default="open")  # open | mitigated | closed
    impact_minutes = Column(Integer, nullable=True)
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    anomalies = relationship("Anomaly", backref="incident")


