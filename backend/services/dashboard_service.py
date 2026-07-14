from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd

from backend.services.dataset_service import (
    DatasetError,
    DatasetNotFoundError,
    load_latest_dataset_path,
)


class DashboardError(DatasetError):
    pass


@dataclass(frozen=True)
class DashboardKPIs:
    total_revenue: float
    total_orders: int
    total_profit: float | None
    unique_products: int | None


def _load_dataset_frame(path: Path | None = None) -> pd.DataFrame:
    if path is None:
        path = load_latest_dataset_path()

    try:
        df = pd.read_csv(path)
    except FileNotFoundError as exc:
        raise DatasetNotFoundError("Latest dataset file could not be found on disk.") from exc
    except Exception as exc:  # pragma: no cover - defensive
        raise DashboardError("Unable to read dataset for analytics.") from exc

    if df.empty:
        raise DashboardError("Dataset is empty; cannot compute dashboard analytics.")

    return df


def _detect_column(df: pd.DataFrame, candidates: list[str]) -> str | None:
    lower_map = {c.lower(): c for c in df.columns}
    for name in candidates:
        actual = lower_map.get(name.lower())
        if actual is not None:
            return actual
    return None


def _coerce_numeric(df: pd.DataFrame, column: str) -> pd.Series:
    s = pd.to_numeric(df[column], errors="coerce")
    return s.fillna(0.0)


def _coerce_date(df: pd.DataFrame, column: str) -> pd.Series:
    return pd.to_datetime(df[column], errors="coerce")


def calculate_kpis(df: pd.DataFrame | None = None) -> DashboardKPIs:
    if df is None:
        df = _load_dataset_frame()

    revenue_col = _detect_column(df, ["Revenue", "Sales", "Amount"])
    if revenue_col is None:
        raise DashboardError('Required "Revenue" column (or equivalent) not found.')
    revenue = _coerce_numeric(df, revenue_col)
    total_revenue = float(revenue.sum())

    orders = len(df.index)

    profit_col = _detect_column(df, ["Profit", "Margin"])
    total_profit: float | None = None
    if profit_col is not None:
        profit = _coerce_numeric(df, profit_col)
        total_profit = float(profit.sum())

    product_col = _detect_column(df, ["Product", "Item", "SKU"])
    unique_products: int | None = None
    if product_col is not None:
        unique_products = int(df[product_col].dropna().nunique())

    return DashboardKPIs(
        total_revenue=total_revenue,
        total_orders=orders,
        total_profit=total_profit,
        unique_products=unique_products,
    )


def revenue_trend_analysis(df: pd.DataFrame | None = None) -> list[dict[str, Any]]:
    if df is None:
        df = _load_dataset_frame()

    date_col = _detect_column(df, ["Date", "OrderDate", "InvoiceDate"])
    revenue_col = _detect_column(df, ["Revenue", "Sales", "Amount"])
    if date_col is None or revenue_col is None:
        raise DashboardError('Required "Date" and "Revenue" columns (or equivalents) not found.')

    dt = _coerce_date(df, date_col)
    rev = _coerce_numeric(df, revenue_col)

    tmp = df.copy()
    tmp["_date"] = dt
    tmp["_revenue"] = rev

    tmp = tmp.dropna(subset=["_date"])

    grouped = tmp.groupby(tmp["_date"].dt.date, as_index=False)["_revenue"].sum()
    grouped = grouped.sort_values("_date")

    return [
        {"date": str(row["_date"]), "revenue": float(row["_revenue"])}
        for _, row in grouped.iterrows()
    ]


def top_products_analysis(limit: int = 10, df: pd.DataFrame | None = None) -> list[dict[str, Any]]:
    if df is None:
        df = _load_dataset_frame()

    product_col = _detect_column(df, ["Product", "Item", "SKU"])
    revenue_col = _detect_column(df, ["Revenue", "Sales", "Amount"])
    if product_col is None or revenue_col is None:
        raise DashboardError('Required "Product" and "Revenue" columns (or equivalents) not found.')

    tmp = df.copy()
    tmp["_revenue"] = _coerce_numeric(df, revenue_col)
    tmp = tmp.dropna(subset=[product_col])

    grouped = (
        tmp.groupby(product_col, as_index=False)["_revenue"]
        .sum()
        .sort_values("_revenue", ascending=False)
        .head(limit)
    )

    return [
        {"product": str(row[product_col]), "revenue": float(row["_revenue"])}
        for _, row in grouped.iterrows()
    ]


def region_analysis(df: pd.DataFrame | None = None) -> list[dict[str, Any]]:
    if df is None:
        df = _load_dataset_frame()

    region_col = _detect_column(df, ["Region", "Market", "Territory"])
    revenue_col = _detect_column(df, ["Revenue", "Sales", "Amount"])
    if region_col is None or revenue_col is None:
        raise DashboardError('Required "Region" and "Revenue" columns (or equivalents) not found.')

    tmp = df.copy()
    tmp["_revenue"] = _coerce_numeric(df, revenue_col)
    tmp = tmp.dropna(subset=[region_col])

    grouped = (
        tmp.groupby(region_col, as_index=False)["_revenue"]
        .sum()
        .sort_values("_revenue", ascending=False)
    )

    return [
        {"region": str(row[region_col]), "revenue": float(row["_revenue"])}
        for _, row in grouped.iterrows()
    ]

