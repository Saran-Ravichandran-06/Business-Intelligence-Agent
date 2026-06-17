from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd


def compute_revenue_trend(
    df: pd.DataFrame, *, metric_col: str, date_col: str
) -> dict[str, Any]:
    tmp = df.copy()
    tmp["_date"] = pd.to_datetime(tmp[date_col], errors="coerce")
    tmp["_metric"] = pd.to_numeric(tmp[metric_col], errors="coerce").fillna(0.0)
    tmp = tmp.dropna(subset=["_date"])

    if tmp.empty:
        return {"metric": metric_col, "trend_direction": "flat", "monthly_values": [], "periods": []}

    tmp["_month"] = tmp["_date"].dt.to_period("M").astype(str)
    grouped = tmp.groupby("_month", as_index=False)["_metric"].sum().sort_values("_month")

    monthly_values = [float(v) for v in grouped["_metric"].tolist()]
    periods = grouped["_month"].tolist()

    if len(monthly_values) < 2:
        return {"metric": metric_col, "trend_direction": "flat", "monthly_values": monthly_values, "periods": periods}

    x = np.arange(len(monthly_values), dtype=float)
    y = np.array(monthly_values, dtype=float)
    # Linear slope of value over time.
    slope = np.polyfit(x, y, 1)[0]

    eps = 1e-9
    if abs(slope) < eps:
        direction = "flat"
    elif slope > 0:
        direction = "increasing"
    else:
        direction = "decreasing"

    return {"metric": metric_col, "trend_direction": direction, "monthly_values": monthly_values, "periods": periods}

