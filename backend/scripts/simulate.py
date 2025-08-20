from __future__ import annotations

import argparse
import random
import time
from datetime import datetime

import requests


def send_metric(api: str, source: str, metric: str, value: float, tags: dict | None = None) -> None:
    payload = {
        "source": source,
        "metric": metric,
        "value": value,
        "timestamp": datetime.utcnow().isoformat(),
        "tags": tags or {},
    }
    requests.post(f"{api}/metrics", json=payload, timeout=5)


def simulate_cpu_spike(api: str) -> None:
    for i in range(30):
        value = 30 + (60 if i > 10 else 0) + random.random() * 10
        send_metric(api, "sim", "cpu", value)
        time.sleep(0.5)


def simulate_error_storm(api: str) -> None:
    for i in range(30):
        value = (1 if i < 10 else 15) + random.random() * 2
        send_metric(api, "sim", "error_rate", value)
        time.sleep(0.5)


def simulate_login_attack(api: str) -> None:
    for i in range(30):
        value = (2 if i < 10 else 25) + random.random() * 5
        send_metric(api, "sim", "failed_logins", value)
        time.sleep(0.5)


def main() -> None:
    parser = argparse.ArgumentParser(description="AutoOps Sentinel simulators")
    parser.add_argument("mode", choices=["cpu-spike", "error-storm", "login-attack"]) 
    parser.add_argument("--api", default="http://localhost:8000")
    args = parser.parse_args()
    if args.mode == "cpu-spike":
        simulate_cpu_spike(args.api)
    elif args.mode == "error-storm":
        simulate_error_storm(args.api)
    else:
        simulate_login_attack(args.api)


if __name__ == "__main__":
    main()


