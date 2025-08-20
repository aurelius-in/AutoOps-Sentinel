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


