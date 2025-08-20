from __future__ import annotations

from statistics import mean, pstdev
from typing import Dict, List


def simple_forecast(values: List[float], horizon: int = 12) -> Dict[str, List[float]]:
    """Naive forecast: mean as level; +/- 2 sigma as bands.

    Returns dict with keys: mean, lower, upper of length == horizon.
    """
    if not values:
        return {"mean": [0.0] * horizon, "lower": [0.0] * horizon, "upper": [0.0] * horizon}
    mu = mean(values)
    sigma = pstdev(values) if len(values) > 1 else 0.0
    return {
        "mean": [mu] * horizon,
        "lower": [mu - 2 * sigma] * horizon,
        "upper": [mu + 2 * sigma] * horizon,
    }


