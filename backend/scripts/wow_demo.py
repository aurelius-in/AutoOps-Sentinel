from __future__ import annotations

import argparse
import os
import time
from typing import Optional

import requests


def api_post(api: str, path: str, json: dict | None = None, token: Optional[str] = None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["X-API-Token"] = token
    r = requests.post(f"{api}{path}", json=json or {}, headers=headers, timeout=10)
    r.raise_for_status()
    return r.json() if r.content else {}


def api_get(api: str, path: str, token: Optional[str] = None):
    headers = {}
    if token:
        headers["X-API-Token"] = token
    r = requests.get(f"{api}{path}", headers=headers, timeout=10)
    r.raise_for_status()
    return r.json()


def wow_demo(api: str, token: Optional[str]):
    print("Resetting demo state…")
    try:
        api_post(api, "/demo/reset", token=token)
    except Exception:
        pass

    print("Simulating error-storm…")
    api_post(api, "/simulate/error-storm", token=token)
    time.sleep(6)
    print("Auto-applying policy suggestions…")
    api_post(api, "/actions/auto", token=token)
    time.sleep(3)

    print("Simulating cpu-spike…")
    api_post(api, "/simulate/cpu-spike", token=token)
    time.sleep(6)
    print("Auto-applying policy suggestions…")
    api_post(api, "/actions/auto", token=token)
    time.sleep(3)

    print("Fetching narrative…")
    nar = api_get(api, "/agent/narrative", token=token)
    for b in nar.get("bullets", []):
        print(f" - {b}")

    print("Generating PDF report… (open in browser)")
    print(f"Report: {api}/report/pdf")


def main() -> None:
    parser = argparse.ArgumentParser(description="AutoOps Sentinel Wow Demo Orchestrator")
    parser.add_argument("--api", default=os.getenv("API", "http://localhost:8000"))
    parser.add_argument("--token", default=os.getenv("API_TOKEN"))
    args = parser.parse_args()
    wow_demo(args.api, args.token)


if __name__ == "__main__":
    main()


