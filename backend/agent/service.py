from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Tuple

from sqlalchemy.orm import Session
from ..common.config import settings

from ..common import models
from ..policy.engine import evaluate_policies


class AgentService:
    def _recent_anomalies(self, db: Session, minutes: int = 60) -> List[models.Anomaly]:
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)
        return (
            db.query(models.Anomaly)
            .filter(models.Anomaly.created_at >= cutoff)
            .order_by(models.Anomaly.created_at.desc())
            .all()
        )

    def _recent_actions(self, db: Session, minutes: int = 60) -> List[models.Action]:
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)
        return (
            db.query(models.Action)
            .filter(models.Action.created_at >= cutoff)
            .order_by(models.Action.created_at.desc())
            .all()
        )

    def generate_plan(self, db: Session, objectives: List[str], context: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], str]:
        anomalies = self._recent_anomalies(db, 120)
        suggestions = evaluate_policies(db)
        steps: List[Dict[str, Any]] = []

        # Heuristics: map metric anomalies to actions
        for a in anomalies[:3]:
            if a.metric in {"error_rate", "latency"} and a.severity in {"high", "critical"}:
                steps.append({
                    "description": f"Rollback recent deployment due to {a.metric} {a.severity}",
                    "action": "rollout_undo",
                    "params": {"deployment": context.get("deployment", "myapp")},
                })
            elif a.metric == "cpu" and a.severity in {"medium", "high", "critical"}:
                steps.append({
                    "description": "Scale deployment to handle CPU pressure",
                    "action": "scale_deployment",
                    "params": {"deployment": context.get("deployment", "myapp"), "replicas": context.get("replicas", 2)},
                })

        # Add policy suggestions
        for s in suggestions:
            steps.append({"description": f"Policy: {s['reason']}", "action": s["action"], "params": {}})

        if not steps:
            steps.append({"description": "No critical issues detected. Continue monitoring.", "action": None, "params": {}})

        explanation = "Generated plan based on recent anomalies and policy rules. Prioritize rollback on errors and scale on CPU pressure."
        return steps, explanation

    def answer_question(self, db: Session, question: str) -> Tuple[str, str]:
        anomalies = self._recent_anomalies(db, 24 * 60)
        actions = self._recent_actions(db, 24 * 60)
        # If OpenAI key present, try to craft a richer narrative
        if settings.openai_api_key:
            try:
                import requests
                context = {
                    "recent_anomalies": [
                        {"metric": a.metric, "severity": a.severity, "score": a.score, "at": a.created_at.isoformat()}
                        for a in anomalies[:10]
                    ],
                    "recent_actions": [
                        {"name": x.name, "success": x.success, "at": x.created_at.isoformat()}
                        for x in actions[:10]
                    ],
                }
                prompt = f"Question: {question}\nContext: {context}\nAnswer with an exec-friendly summary."
                # Minimal OpenAI-compatible call (uses responses API style)
                r = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"},
                    json={
                        "model": settings.model_name,
                        "messages": [
                            {"role": "system", "content": "You are an SRE assistant."},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.2,
                    },
                    timeout=15,
                )
                if r.ok:
                    data = r.json()
                    content = data["choices"][0]["message"]["content"]
                    return content, "LLM-generated summary based on recent context."
            except Exception:
                pass
        if "what happened in the last hour" in question.lower():
            ans = f"Detected {len([a for a in anomalies if (datetime.utcnow() - a.created_at).total_seconds() <= 3600])} anomalies and executed {len([x for x in actions if (datetime.utcnow() - x.created_at).total_seconds() <= 3600])} actions."
            return ans, "Summarized counts from the last hour."
        if "prevent" in question.lower() or "avoided" in question.lower():
            saved_minutes = 5 * len(actions)
            ans = f"We likely prevented ~{saved_minutes} minutes of downtime across {len(actions)} actions by early remediation."
            return ans, "Estimate based on a simple heuristic of 5 minutes saved per action."
        # Default narrative
        if anomalies:
            latest = anomalies[0]
            ans = f"Latest anomaly: {latest.metric} with severity {latest.severity}. Suggested action: monitor or apply relevant runbook."
        else:
            ans = "System is stable. No recent anomalies."
        return ans, "Heuristic narrative without external LLM."


