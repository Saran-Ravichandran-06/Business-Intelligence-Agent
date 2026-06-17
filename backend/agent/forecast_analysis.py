from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression


def compute_forecast(
    df: pd.DataFrame, *, metric_col: str, date_col: str, forecast_period: str = "next_month"
) -> dict[str, Any]:
    tmp = df.copy()
    tmp["_date"] = pd.to_datetime(tmp[date_col], errors="coerce")
    tmp["_metric"] = pd.to_numeric(tmp[metric_col], errors="coerce").fillna(0.0)
    tmp = tmp.dropna(subset=["_date"])

    if tmp.empty:
        raise ValueError("Dataset is empty; cannot forecast.")

    tmp["_month"] = tmp["_date"].dt.to_period("M").astype(str)
    grouped = tmp.groupby("_month", as_index=False)["_metric"].sum()
    grouped = grouped.sort_values("_month")

    y = grouped["_metric"].astype(float).to_numpy()
    periods = grouped["_month"].tolist()

    if len(y) < 2:
        raise ValueError("Not enough data points to forecast (need at least 2 months).")

    x = np.arange(len(y), dtype=float).reshape(-1, 1)
    model = LinearRegression()
    model.fit(x, y)

    next_x = np.array([[len(y)]], dtype=float)
    predicted = float(model.predict(next_x)[0])

    return {"predicted_revenue": predicted, "forecast_period": forecast_period, "periods_used": periods}

