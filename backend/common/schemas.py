from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MetricIn(BaseModel):
    source: str = Field(...)
    metric: str = Field(...)
    value: float = Field(...)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    tags: Dict[str, Any] = Field(default_factory=dict)


class AnomalyOut(BaseModel):
    id: str
    metric: str
    score: float
    severity: str
    details: Dict[str, Any] | None = None
    created_at: datetime


class ExecuteActionIn(BaseModel):
    name: str
    params: Dict[str, Any] = Field(default_factory=dict)


class ExecuteActionOut(BaseModel):
    success: bool
    duration_seconds: float
    logs: str
    action_id: str | None = None


class AgentQueryIn(BaseModel):
    question: str


class AgentQueryOut(BaseModel):
    answer: str
    reasoning: str | None = None


class AgentPlanIn(BaseModel):
    objectives: List[str] = Field(default_factory=list)
    context: Dict[str, Any] = Field(default_factory=dict)


class PlanStep(BaseModel):
    description: str
    action: str | None = None
    params: Dict[str, Any] = Field(default_factory=dict)


class AgentPlanOut(BaseModel):
    steps: List[PlanStep]
    explanation: str


