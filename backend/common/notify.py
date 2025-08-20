from __future__ import annotations

import json
from typing import Any, Dict
import time

import requests

from .config import settings


_last_sent_at: float = 0.0


def send_webhook(message: str, payload: Dict[str, Any] | None = None, min_interval_seconds: float = 10.0) -> None:
    if not settings.webhook_url:
        return
    try:
        global _last_sent_at
        now = time.time()
        if now - _last_sent_at < min_interval_seconds:
            return
        # Slack-compatible message if webhook looks like Slack
        data: Dict[str, Any]
        if settings.webhook_url and "hooks.slack.com" in settings.webhook_url:
            data = {"text": message}
        elif settings.webhook_url and ".office.com/webhook/" in settings.webhook_url:
            # Basic Teams format
            data = {"text": message}
        else:
            data = {"text": message, "payload": payload or {}}
        requests.post(settings.webhook_url, headers={"Content-Type": "application/json"}, data=json.dumps(data), timeout=5)
        _last_sent_at = now
    except Exception:
        # best-effort
        pass


