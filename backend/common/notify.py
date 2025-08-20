from __future__ import annotations

import json
from typing import Any, Dict

import requests

from .config import settings


def send_webhook(message: str, payload: Dict[str, Any] | None = None) -> None:
    if not settings.webhook_url:
        return
    try:
        data = {"text": message, "payload": payload or {}}
        requests.post(settings.webhook_url, headers={"Content-Type": "application/json"}, data=json.dumps(data), timeout=5)
    except Exception:
        # best-effort
        pass


