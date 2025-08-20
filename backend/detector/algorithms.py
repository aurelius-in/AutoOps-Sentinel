from __future__ import annotations

from statistics import mean, pstdev
from typing import List, Optional

try:
    from sklearn.ensemble import IsolationForest  # type: ignore
    _SKLEARN = True
except Exception:  # noqa: BLE001
    _SKLEARN = False


def rolling_zscore(values: List[float], last_k: int = 1, threshold: float = 3.0) -> Optional[float]:
    if len(values) < 5:
        return None
    baseline = values[:-last_k] if last_k > 0 else values
    if len(baseline) < 3:
        return None
    mu = mean(baseline)
    sigma = pstdev(baseline) or 1e-6
    z = (values[-1] - mu) / sigma
    return z if abs(z) >= threshold else None


def isolation_forest_score(values: List[float]) -> Optional[float]:
    if not _SKLEARN or len(values) < 10:
        return None
    # shape as 2D features with lag to make it slightly multivariate
    series = [[values[i], values[i - 1] if i > 0 else values[i]] for i in range(len(values))]
    model = IsolationForest(n_estimators=50, contamination="auto", random_state=42)
    model.fit(series)
    # higher negative score = more anomalous; return last point score
    s = -float(model.score_samples([series[-1]])[0])
    # normalize to a simple threshold notion
    return s if s >= 0.5 else None


def mad_anomaly_score(values: List[float], last_k: int = 1, threshold: float = 3.5) -> Optional[float]:
    if len(values) < 7:
        return None
    import math

    baseline = values[:-last_k] if last_k > 0 else values
    if len(baseline) < 5:
        return None
    # Median
    sorted_vals = sorted(baseline)
    mid = len(sorted_vals) // 2
    median = (sorted_vals[mid] if len(sorted_vals) % 2 == 1 else (sorted_vals[mid - 1] + sorted_vals[mid]) / 2)
    # MAD
    abs_dev = [abs(v - median) for v in baseline]
    abs_dev.sort()
    mad = (abs_dev[mid] if len(abs_dev) % 2 == 1 else (abs_dev[mid - 1] + abs_dev[mid]) / 2) or 1e-6
    last_value = values[-1]
    # Modified z-score: 0.6745 * (x - median) / MAD
    mz = 0.6745 * (last_value - median) / mad
    return mz if abs(mz) >= threshold else None


