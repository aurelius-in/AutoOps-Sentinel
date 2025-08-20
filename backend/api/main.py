from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
from typing import List

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from ..common.db import Base, engine, get_db_session
from ..common import models
from ..common.schemas import (
    MetricIn,
    AnomalyOut,
    ExecuteActionIn,
    ExecuteActionOut,
    AgentQueryIn,
    AgentQueryOut,
    AgentPlanIn,
    AgentPlanOut,
    PlanStep,
)
from ..common.config import settings
from ..detector.detector import run_detection_cycle
from ..detector.forecast import simple_forecast
from ..remediator.executor import execute_runbook, list_runbooks
from ..agent.service import AgentService
from ..policy.engine import evaluate_policies


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    # Create tables for demo; in production use Alembic migrations
    Base.metadata.create_all(bind=engine)

    async def detector_loop():
        while True:
            try:
                await run_detection_cycle()
            except Exception as exc:  # noqa: BLE001
                # Basic log; replace with structured logging
                print(f"[detector] error: {exc}")
            await asyncio.sleep(settings.detector_interval_seconds)

    # Fire-and-forget background task
    asyncio.create_task(detector_loop())


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "time": datetime.utcnow().isoformat()}


@app.get("/summary")
def summary(db: Session = Depends(get_db_session)) -> dict:
    anomalies = db.query(models.Anomaly).count()
    actions = db.query(models.Action).count()
    incidents = db.query(models.Incident).count()
    return {"anomalies": anomalies, "actions": actions, "incidents": incidents}


@app.get("/policies/suggest")
def policy_suggestions(db: Session = Depends(get_db_session)) -> list[dict]:
    return evaluate_policies(db)


@app.get("/forecast")
def forecast(metric: str = "cpu", horizon: int = 12, db: Session = Depends(get_db_session)) -> dict:
    from ..detector.detector import _load_recent_metrics  # local import to avoid cycle in uvicorn

    series = _load_recent_metrics(db)
    values = [v for _, v in series.get(metric, [])]
    return simple_forecast(values, horizon=horizon)


@app.get("/business")
def business_summary(db: Session = Depends(get_db_session)) -> dict:
    actions = db.query(models.Action).count()
    downtime_avoided_min = actions * 5
    cost_per_min = 1500  # illustrative
    return {"downtime_avoided_min": downtime_avoided_min, "cost_avoided": downtime_avoided_min * cost_per_min}


@app.post("/metrics")
def ingest_metric(metric: MetricIn, db: Session = Depends(get_db_session)) -> dict:
    event = models.Event(
        source=metric.source,
        type="metric",
        payload={
            "metric": metric.metric,
            "value": metric.value,
            "timestamp": metric.timestamp.isoformat(),
            "tags": metric.tags,
        },
    )
    db.add(event)
    db.commit()
    return {"status": "ok"}


@app.get("/anomalies", response_model=List[AnomalyOut])
def get_anomalies(db: Session = Depends(get_db_session)) -> List[AnomalyOut]:
    rows = (
        db.query(models.Anomaly)
        .order_by(models.Anomaly.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        AnomalyOut(
            id=str(r.id),
            metric=r.metric,
            score=r.score,
            severity=r.severity,
            details=r.details,
            created_at=r.created_at,
        )
        for r in rows
    ]


@app.post("/actions/execute", response_model=ExecuteActionOut)
def execute_action(payload: ExecuteActionIn, db: Session = Depends(get_db_session)) -> ExecuteActionOut:
    result = execute_runbook(payload.name, payload.params)
    # Persist action
    action = models.Action(
        name=payload.name,
        input=payload.params,
        result=result,
        success=bool(result.get("success")),
    )
    db.add(action)
    db.commit()
    return ExecuteActionOut(
        success=bool(result.get("success")),
        duration_seconds=float(result.get("duration_seconds", 0.0)),
        logs=str(result.get("logs", "")),
        action_id=str(action.id),
    )


@app.get("/actions")
def list_actions(db: Session = Depends(get_db_session)) -> list[dict]:
    rows = (
        db.query(models.Action)
        .order_by(models.Action.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "id": str(r.id),
            "name": r.name,
            "success": r.success,
            "created_at": r.created_at.isoformat(),
            "result": r.result,
        }
        for r in rows
    ]


@app.get("/runbooks")
def get_runbooks() -> list[dict]:
    return list_runbooks()


@app.post("/agent/query", response_model=AgentQueryOut)
def agent_query(payload: AgentQueryIn, db: Session = Depends(get_db_session)) -> AgentQueryOut:
    agent = AgentService()
    answer, reasoning = agent.answer_question(db, payload.question)
    return AgentQueryOut(answer=answer, reasoning=reasoning)


@app.post("/agent/plan", response_model=AgentPlanOut)
def agent_plan(payload: AgentPlanIn, db: Session = Depends(get_db_session)) -> AgentPlanOut:
    agent = AgentService()
    steps, explanation = agent.generate_plan(db, payload.objectives, payload.context)
    return AgentPlanOut(
        steps=[PlanStep(**s) for s in steps],
        explanation=explanation,
    )


