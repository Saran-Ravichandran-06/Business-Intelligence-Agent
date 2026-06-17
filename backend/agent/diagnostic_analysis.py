from __future__ import annotations

from typing import Any

import pandas as pd


def _month_key(series: pd.Series) -> pd.Series:
    return series.dt.to_period("M").astype(str)


def compute_monthly_values(
    df: pd.DataFrame, *, metric_col: str, date_col: str, month_key: str
) -> float:
    tmp = df.copy()
    tmp["_date"] = pd.to_datetime(tmp[date_col], errors="coerce")
    tmp["_metric"] = pd.to_numeric(tmp[metric_col], errors="coerce").fillna(0.0)
    tmp = tmp.dropna(subset=["_date"])
    tmp["_month"] = _month_key(tmp["_date"])
    return float(tmp.loc[tmp["_month"] == month_key, "_metric"].sum())


def compute_diagnostic(
    df: pd.DataFrame,
    *,
    metric_col: str,
    date_col: str,
    current_month_key: str,
    previous_month_key: str,
    contributor_col: str | None,
) -> dict[str, Any]:
    current_value = compute_monthly_values(
        df, metric_col=metric_col, date_col=date_col, month_key=current_month_key
    )
    previous_value = compute_monthly_values(
        df, metric_col=metric_col, date_col=date_col, month_key=previous_month_key
    )

    if previous_value == 0:
        change_percent = None
    else:
        change_percent = ((current_value - previous_value) / previous_value) * 100.0

    top_contributor = None
    if contributor_col:
        tmp = df.copy()
        tmp["_date"] = pd.to_datetime(tmp[date_col], errors="coerce")
        tmp["_metric"] = pd.to_numeric(tmp[metric_col], errors="coerce").fillna(0.0)
        tmp = tmp.dropna(subset=["_date"])

        tmp["_month"] = _month_key(tmp["_date"])

        cur = tmp.loc[tmp["_month"] == current_month_key].groupby(contributor_col)["_metric"].sum()
        prev = tmp.loc[tmp["_month"] == previous_month_key].groupby(contributor_col)["_metric"].sum()

        diff = (cur - prev).fillna(0.0)
        if not diff.empty:
            # Most affected by absolute change.
            idx = diff.abs().sort_values(ascending=False).index[0]
            top_contributor = str(idx)

    return {
        "current_value": current_value,
        "previous_value": previous_value,
        "change_percent": change_percent,
        "top_contributor": top_contributor,
    }

