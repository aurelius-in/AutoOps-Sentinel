from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, List, Tuple

from .config import settings

try:
    from influxdb_client import InfluxDBClient, Point
    _INFLUX = True
except Exception:  # noqa: BLE001
    _INFLUX = False


def write_metric_influx(metric: str, value: float, tags: Dict[str, str] | None = None, timestamp: datetime | None = None) -> None:
    if not _INFLUX or not settings.influx_url or not settings.influx_token or not settings.influx_org or not settings.influx_bucket:
        return
    with InfluxDBClient(url=settings.influx_url, token=settings.influx_token, org=settings.influx_org) as client:
        write_api = client.write_api()
        p = Point("metrics").tag("metric", metric).field("value", float(value))
        for k, v in (tags or {}).items():
            p = p.tag(k, str(v))
        if timestamp:
            p = p.time(timestamp)
        write_api.write(bucket=settings.influx_bucket, record=p)


def query_recent_metrics_influx(minutes: int = 15) -> Dict[str, List[Tuple[datetime, float]]]:
    series: Dict[str, List[Tuple[datetime, float]]] = {}
    if not _INFLUX or not settings.influx_url or not settings.influx_token or not settings.influx_org or not settings.influx_bucket:
        return series
    with InfluxDBClient(url=settings.influx_url, token=settings.influx_token, org=settings.influx_org) as client:
        query_api = client.query_api()
        start = f"-{minutes}m"
        q = f'from(bucket:"{settings.influx_bucket}") |> range(start: {start}) |> filter(fn: (r) => r._measurement == "metrics")'
        tables = query_api.query(q)
        for table in tables:
            for record in table.records:
                metric = str(record.values.get("metric"))
                value = float(record.get_value())
                ts = record.get_time()
                series.setdefault(metric, []).append((ts, value))
    return series


