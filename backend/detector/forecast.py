from __future__ import annotations

from statistics import mean, pstdev
from typing import Dict, List

try:
    from prophet import Prophet  # type: ignore
    _PROPHET = True
except Exception:  # noqa: BLE001
    _PROPHET = False


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


def prophet_forecast(values: List[float], horizon: int = 12) -> Dict[str, List[float]]:
    if not _PROPHET or len(values) < 10:
        return simple_forecast(values, horizon)
    # Build a simple dataframe with step index as time
    import pandas as pd  # type: ignore

    df = pd.DataFrame({"ds": pd.date_range("2020-01-01", periods=len(values), freq="T"), "y": values})
    m = Prophet(daily_seasonality=False, weekly_seasonality=False, yearly_seasonality=False)
    m.fit(df)
    future = m.make_future_dataframe(periods=horizon, freq="T")
    forecast = m.predict(future).tail(horizon)
    mean_vals = forecast["yhat"].tolist()
    lower = forecast["yhat_lower"].tolist()
    upper = forecast["yhat_upper"].tolist()
    return {"mean": mean_vals, "lower": lower, "upper": upper}


