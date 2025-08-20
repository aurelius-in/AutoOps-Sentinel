from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
from typing import List

from fastapi import Depends, FastAPI
import asyncio
import random
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, PlainTextResponse
from sqlalchemy.orm import Session

from ..common.db import Base, engine, get_db_session, SessionLocal
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
    ExecutePlanIn,
    ExecutePlanOut,
)
from ..common.config import settings
from ..detector.detector import run_detection_cycle
from ..detector.forecast import simple_forecast, prophet_forecast
from ..remediator.executor import execute_runbook, list_runbooks, preview_runbook
from ..agent.service import AgentService
from ..policy.engine import evaluate_policies, load_rules
from ..common.ops import mitigate_incidents_for_action
from .security import require_admin_token
from ..common.logging import configure_root_logger


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    # Create tables for demo; in production use Alembic migrations
    configure_root_logger()
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

    async def cleanup_loop():
        while True:
            try:
                # prune records older than 7 days
                db: Session = SessionLocal()
                cutoff = datetime.utcnow() - timedelta(days=7)
                db.query(models.Event).filter(models.Event.created_at < cutoff).delete()
                db.query(models.Anomaly).filter(models.Anomaly.created_at < cutoff).delete()
                db.query(models.Action).filter(models.Action.created_at < cutoff).delete()
                db.query(models.Incident).filter(models.Incident.created_at < cutoff).delete()
                db.commit()
                db.close()
            except Exception as exc:  # noqa: BLE001
                print(f"[cleanup] error: {exc}")
            await asyncio.sleep(3600)

    asyncio.create_task(cleanup_loop())

    if settings.auto_apply_policies:
        async def policy_loop():
            while True:
                try:
                    db: Session = SessionLocal()
                    suggestions = evaluate_policies(db)
                    for s in suggestions:
                        res = execute_runbook(s.get("action"), {"deployment": "myapp", "replicas": 2, "approved": True})
                        db.add(models.Action(name=s.get("action"), input={}, result=res, success=bool(res.get("success"))))
                    db.commit()
                    db.close()
                except Exception as exc:  # noqa: BLE001
                    print(f"[policy] error: {exc}")
                await asyncio.sleep(settings.policy_check_interval_seconds)
        asyncio.create_task(policy_loop())


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "time": datetime.utcnow().isoformat()}


@app.get("/summary")
def summary(db: Session = Depends(get_db_session)) -> dict:
    anomalies = db.query(models.Anomaly).count()
    actions = db.query(models.Action).count()
    incidents = db.query(models.Incident).count()
    return {"anomalies": anomalies, "actions": actions, "incidents": incidents}


@app.get("/version")
def version() -> dict:
    return {
        "app": settings.app_name,
        "env": settings.env,
        "model": settings.model_name,
    }


@app.get("/policies/suggest")
def policy_suggestions(db: Session = Depends(get_db_session)) -> list[dict]:
    return evaluate_policies(db)


@app.get("/policies")
def list_policies() -> list[dict]:
    return [
        {"condition": r.condition, "action": r.action}
        for r in load_rules()
    ]


@app.post("/actions/auto", dependencies=[Depends(require_admin_token)])
def auto_apply_actions(db: Session = Depends(get_db_session)) -> dict:
    suggestions = evaluate_policies(db)
    results = []
    for s in suggestions:
        name = s.get("action")
        params = {"deployment": "myapp", "replicas": 2, "approved": True}
        res = execute_runbook(name, params)
        action = models.Action(
            name=name,
            input=params,
            result=res,
            success=bool(res.get("success")),
        )
        db.add(action)
        results.append({"name": name, "result": res, "action_id": None})
    db.commit()
    return {"applied": len(results), "results": results}


@app.get("/forecast")
def forecast(metric: str = "cpu", horizon: int = 12, method: str = "naive", db: Session = Depends(get_db_session)) -> dict:
    from ..detector.detector import _load_recent_metrics  # local import to avoid cycle in uvicorn

    series = _load_recent_metrics(db)
    values = [v for _, v in series.get(metric, [])]
    if method == "prophet":
        return prophet_forecast(values, horizon=horizon)
    return simple_forecast(values, horizon=horizon)


@app.get("/business")
def business_summary(db: Session = Depends(get_db_session)) -> dict:
    actions = db.query(models.Action).count()
    downtime_avoided_min = actions * 5
    cost_per_min = 1500  # illustrative
    return {"downtime_avoided_min": downtime_avoided_min, "cost_avoided": downtime_avoided_min * cost_per_min}


async def _simulate_mode(mode: str, seconds: int = 15) -> None:
    db: Session = SessionLocal()
    try:
        iterations = max(1, seconds * 2)
        for i in range(iterations):
            now = datetime.utcnow().isoformat()
            if mode == "cpu-spike":
                value = (30 + random.random() * 5) if i < iterations // 3 else (92 + random.random() * 6)
                payload = {"metric": "cpu", "value": value, "timestamp": now, "tags": {"sim": True}}
            elif mode == "error-storm":
                value = (1 + random.random() * 2) if i < iterations // 3 else (12 + random.random() * 4)
                payload = {"metric": "error_rate", "value": value, "timestamp": now, "tags": {"sim": True}}
            else:
                value = (2 + random.random() * 3) if i < iterations // 3 else (20 + random.random() * 5)
                payload = {"metric": "failed_logins", "value": value, "timestamp": now, "tags": {"sim": True}}
            db.add(models.Event(source="sim", type="metric", payload=payload))
            if (i + 1) % 10 == 0:
                db.commit()
            await asyncio.sleep(0.5)
        db.commit()
    finally:
        db.close()


@app.post("/simulate/{mode}", dependencies=[Depends(require_admin_token)])
async def start_simulation(mode: str) -> dict:
    if mode not in {"cpu-spike", "error-storm", "login-attack"}:
        return {"status": "error", "message": "invalid mode"}
    asyncio.create_task(_simulate_mode(mode))
    return {"status": "started", "mode": mode}


async def _wow_demo_sequence(token_guarded: bool = False) -> None:
    # Orchestrate: reset -> error-storm -> auto-apply -> cpu-spike -> auto-apply
    # Uses direct DB access to avoid HTTP recursion
    db: Session = SessionLocal()
    try:
        db.query(models.Action).delete()
        db.query(models.Anomaly).delete()
        db.query(models.Incident).delete()
        db.query(models.Event).delete()
        db.commit()

        await _simulate_mode("error-storm", seconds=10)
        # auto-apply policies
        suggestions = evaluate_policies(db)
        for s in suggestions:
            res = execute_runbook(s.get("action"), {"deployment": "myapp", "replicas": 2, "approved": True})
            db.add(models.Action(name=s.get("action"), input={}, result=res, success=bool(res.get("success"))))
        db.commit()

        await _simulate_mode("cpu-spike", seconds=10)
        suggestions = evaluate_policies(db)
        for s in suggestions:
            res = execute_runbook(s.get("action"), {"deployment": "myapp", "replicas": 2, "approved": True})
            db.add(models.Action(name=s.get("action"), input={}, result=res, success=bool(res.get("success"))))
        db.commit()
    finally:
        db.close()


@app.post("/demo/wow", dependencies=[Depends(require_admin_token)])
def demo_wow() -> dict:
    asyncio.create_task(_wow_demo_sequence())
    return {"status": "started"}


@app.post("/demo/reset", dependencies=[Depends(require_admin_token)])
def demo_reset(db: Session = Depends(get_db_session)) -> dict:
    # delete in order of dependencies
    db.query(models.Action).delete()
    db.query(models.Anomaly).delete()
    db.query(models.Incident).delete()
    db.query(models.Event).delete()
    db.commit()
    return {"status": "ok"}


@app.get("/report/pdf")
def export_report_pdf(db: Session = Depends(get_db_session)):
    from reportlab.lib.pagesizes import LETTER
    from reportlab.pdfgen import canvas
    import io

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=LETTER)
    width, height = LETTER
    y = height - 72
    c.setFont("Helvetica-Bold", 16)
    c.drawString(72, y, "AutoOps Sentinel Report")
    y -= 24
    c.setFont("Helvetica", 10)
    s = summary(db)
    b = business_summary(db)
    lines = [
        f"Anomalies: {s['anomalies']}",
        f"Actions: {s['actions']}",
        f"Incidents: {s['incidents']}",
        f"Downtime avoided (min): {b['downtime_avoided_min']}",
        f"Cost avoided ($): {b['cost_avoided']}",
    ]
    for line in lines:
        y -= 16
        c.drawString(72, y, line)
    c.showPage()
    c.save()
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=autoops-report.pdf"})


@app.get("/metrics/keys")
def metric_keys(db: Session = Depends(get_db_session)) -> list[str]:
    q = (
        db.query(models.Event)
        .filter(models.Event.type == "metric")
        .order_by(models.Event.created_at.desc())
        .limit(2000)
        .all()
    )
    keys: set[str] = set()
    for e in q:
        payload = e.payload or {}
        m = payload.get("metric")
        if isinstance(m, str):
            keys.add(m)
    return sorted(keys)


@app.get("/metrics/recent")
def recent_metric(metric: str = "cpu", minutes: int = 15, db: Session = Depends(get_db_session)) -> dict:
    from ..detector.detector import _load_recent_metrics  # local import to avoid cycle

    series = _load_recent_metrics(db, minutes=minutes)
    points = [{"ts": ts.isoformat(), "value": v} for ts, v in series.get(metric, [])]
    return {"metric": metric, "minutes": minutes, "points": points}


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


@app.get("/events")
def list_events(db: Session = Depends(get_db_session)) -> list[dict]:
    rows = (
        db.query(models.Event)
        .order_by(models.Event.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        {"id": str(r.id), "type": r.type, "source": r.source, "created_at": r.created_at.isoformat(), "payload": r.payload}
        for r in rows
    ]


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


@app.get("/anomalies/stats")
def anomaly_stats(db: Session = Depends(get_db_session)) -> dict:
    rows = (
        db.query(models.Anomaly)
        .order_by(models.Anomaly.created_at.desc())
        .limit(1000)
        .all()
    )
    stats: dict = {}
    for r in rows:
        metric = r.metric
        sev = r.severity
        stats.setdefault(metric, {"low": 0, "medium": 0, "high": 0, "critical": 0})
        if sev in stats[metric]:
            stats[metric][sev] += 1
    return stats


@app.post("/actions/execute", response_model=ExecuteActionOut, dependencies=[Depends(require_admin_token)])
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
    mitigate_incidents_for_action(db, payload.name)
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


@app.get("/actions/{action_id}")
def get_action(action_id: str, db: Session = Depends(get_db_session)) -> dict:
    row = db.query(models.Action).filter(models.Action.id == action_id).first()
    if not row:
        return {"error": "not_found"}
    return {
        "id": str(row.id),
        "name": row.name,
        "success": row.success,
        "created_at": row.created_at.isoformat(),
        "result": row.result,
    }


@app.get("/export/anomalies.csv")
def export_anomalies_csv(db: Session = Depends(get_db_session)) -> PlainTextResponse:
    rows = (
        db.query(models.Anomaly)
        .order_by(models.Anomaly.created_at.desc())
        .limit(1000)
        .all()
    )
    lines = ["id,metric,score,severity,created_at"]
    for r in rows:
        lines.append(f"{r.id},{r.metric},{r.score},{r.severity},{r.created_at.isoformat()}")
    csv = "\n".join(lines)
    return PlainTextResponse(content=csv, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=anomalies.csv"})


@app.get("/export/actions.csv")
def export_actions_csv(db: Session = Depends(get_db_session)) -> PlainTextResponse:
    rows = (
        db.query(models.Action)
        .order_by(models.Action.created_at.desc())
        .limit(1000)
        .all()
    )
    lines = ["id,name,success,created_at"]
    for r in rows:
        lines.append(f"{r.id},{r.name},{int(bool(r.success))},{r.created_at.isoformat()}")
    csv = "\n".join(lines)
    return PlainTextResponse(content=csv, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=actions.csv"})


@app.get("/runbooks")
def get_runbooks(db: Session = Depends(get_db_session)) -> list[dict]:
    items = list_runbooks()
    # enrich with simple success-rate stats from recent actions
    for item in items:
        name = item.get("name")
        if not name:
            continue
        q = (
            db.query(models.Action)
            .filter(models.Action.name == name)
            .order_by(models.Action.created_at.desc())
            .limit(50)
            .all()
        )
        total = len(q)
        ok = len([a for a in q if a.success])
        last_success = next((a.created_at.isoformat() for a in q if a.success), None)
        item["recent_success_rate"] = (ok / total) if total else None
        item["last_success_at"] = last_success
    return items


@app.post("/runbooks/preview")
def runbook_preview(payload: dict) -> dict:
    name = str(payload.get("name"))
    params = payload.get("params") or {}
    return preview_runbook(name, params)


@app.get("/slo")
def slo(target: float = 99.9, db: Session = Depends(get_db_session)) -> dict:
    from statistics import mean

    # naive availability from recent error_rate (%), and p95 latency
    cutoff_minutes = 60
    events = (
        db.query(models.Event)
        .filter(models.Event.type == "metric")
        .order_by(models.Event.created_at.desc())
        .limit(2000)
        .all()
    )
    error_rates = []
    latencies = []
    for e in events:
        payload = e.payload or {}
        m = payload.get("metric")
        v = payload.get("value")
        if m == "error_rate":
            error_rates.append(float(v))
        elif m == "latency":
            latencies.append(float(v))
    availability = max(0.0, 100.0 - (mean(error_rates) if error_rates else 0.0))
    p95 = None
    if latencies:
        s = sorted(latencies)
        idx = int(0.95 * (len(s) - 1))
        p95 = s[idx]
    allowed_error = max(0.0, 100.0 - float(target))
    actual_error = max(0.0, 100.0 - availability)
    ebr = None
    if allowed_error > 0:
        ebr = max(0.0, (allowed_error - actual_error) / allowed_error * 100.0)
    return {"availability_pct": availability, "latency_p95_ms": p95, "target_slo_pct": float(target), "error_budget_remaining_pct": ebr}


@app.get("/incidents")
def list_incidents(db: Session = Depends(get_db_session)) -> list[dict]:
    rows = (
        db.query(models.Incident)
        .order_by(models.Incident.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "id": str(r.id),
            "title": r.title,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


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


@app.get("/agent/narrative")
def agent_narrative(db: Session = Depends(get_db_session)) -> dict:
    agent = AgentService()
    return agent.narrative_summary(db)


@app.post("/agent/execute_plan", response_model=ExecutePlanOut, dependencies=[Depends(require_admin_token)])
def execute_plan(payload: ExecutePlanIn, db: Session = Depends(get_db_session)) -> ExecutePlanOut:
    results = []
    succeeded = 0
    failed = 0
    for step in payload.steps:
        if not step.action:
            results.append({"description": step.description, "action": None, "success": True, "logs": None})
            continue
        res = execute_runbook(step.action, step.params or {})
        ok = bool(res.get("success"))
        succeeded += int(ok)
        failed += int(not ok)
        results.append({
            "description": step.description,
            "action": step.action,
            "success": ok,
            "logs": str(res.get("logs")),
        })
    return ExecutePlanOut(results=results, succeeded=succeeded, failed=failed)


