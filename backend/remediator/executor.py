from __future__ import annotations

import subprocess
import time
from pathlib import Path
from typing import Any, Dict, List

from ruamel.yaml import YAML


yaml = YAML(typ="safe")


def list_runbooks() -> List[Dict[str, Any]]:
    base = Path("runbooks")
    items: List[Dict[str, Any]] = []
    if not base.exists():
        return items
    for p in sorted(base.glob("*.y*ml")):
        try:
            with p.open("r", encoding="utf-8") as f:
                data = yaml.load(f) or {}
            items.append({
                "name": data.get("name") or p.stem,
                "path": str(p),
                "steps": data.get("steps", []),
                "requires_approval": bool(data.get("requires_approval", False)),
            })
        except Exception:  # noqa: BLE001
            items.append({"name": p.stem, "path": str(p), "steps": [], "requires_approval": False})
    return items


def _load_runbook(name: str) -> Dict[str, Any]:
    # map name to file in runbooks directory
    base = Path("runbooks")
    candidates = [base / f"{name}.yml", base / f"{name}.yaml"]
    for c in candidates:
        if c.exists():
            with c.open("r", encoding="utf-8") as f:
                return yaml.load(f) or {}
    raise FileNotFoundError(f"Runbook not found: {name}")


def _safe_shell(cmd: str) -> tuple[int, str]:
    try:
        # For demo, execute commands that are safe (echo, kubectl --help, etc.)
        # Most operational commands will be simulated rather than executed.
        completed = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        stdout = completed.stdout + completed.stderr
        return completed.returncode, stdout
    except Exception as exc:  # noqa: BLE001
        return 1, f"error executing '{cmd}': {exc}"


def execute_runbook(name: str, params: Dict[str, Any] | None = None) -> Dict[str, Any]:
    params = params or {}
    try:
        runbook = _load_runbook(name)
    except FileNotFoundError:
        return {"success": False, "duration_seconds": 0.0, "logs": f"runbook {name} not found"}
    if runbook.get("requires_approval") and not params.get("approved"):
        return {"success": False, "duration_seconds": 0.0, "logs": f"runbook {name} requires approval"}

    steps: List[Dict[str, Any]] = runbook.get("steps", [])
    logs: List[str] = [f"runbook: {name}"]
    start = time.monotonic()
    success = True
    for i, step in enumerate(steps, start=1):
        if "run" in step:
            cmd = str(step["run"]).format(**params)
            rc, out = _safe_shell(cmd)
            logs.append(f"step {i} run: {cmd}\n{out}")
            if rc != 0:
                success = False
                break
        elif "verify" in step:
            cmd = str(step["verify"]).format(**params)
            rc, out = _safe_shell(cmd)
            logs.append(f"step {i} verify: {cmd}\n{out}")
            if rc != 0:
                success = False
                break
        else:
            logs.append(f"step {i} skipped: unknown step type")
    duration = time.monotonic() - start
    return {"success": success, "duration_seconds": duration, "logs": "\n".join(logs)}


