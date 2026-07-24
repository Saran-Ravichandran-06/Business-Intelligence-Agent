from __future__ import annotations

import calendar
import re
from typing import Any

import numpy as np
import pandas as pd

from backend.agent.diagnostic_analysis import compute_diagnostic
from backend.agent.forecast_analysis import compute_forecast
from backend.agent.comparison_analysis import compute_comparison
from backend.agent.trend_analysis import compute_revenue_trend
from backend.agent.models import AnalyzeResponse, SupportedAnalysisType
from backend.services.dataset_service import DatasetNotFoundError, load_latest_dataset_path


class AnalyticsError(Exception):
    pass


def _detect_column(df: pd.DataFrame, candidates: list[str]) -> str | None:
    lower_map = {c.lower(): c for c in df.columns}
    for name in candidates:
        actual = lower_map.get(name.lower())
        if actual is not None:
            return actual
    return None


def _coerce_numeric_series(df: pd.DataFrame, column: str) -> pd.Series:
    return pd.to_numeric(df[column], errors="coerce").fillna(0.0)


def _coerce_datetime_series(df: pd.DataFrame, column: str) -> pd.Series:
    return pd.to_datetime(df[column], errors="coerce")


def _parse_month_reference(time_period: str | None) -> tuple[int, int | None]:
    """
    Returns (month_number, year_number_or_none).

    Supports:
    - 'march' / 'March'
    - '2026-03' / '2026/03'
    - '2026 march'
    """
    if not time_period:
        raise AnalyticsError("time_period is required.")

    s = str(time_period).strip().lower()
    s = s.replace("_", " ")

    # Extract 4-digit year if present.
    year_match = re.search(r"\b(19\d{2}|20\d{2})\b", s)
    year = int(year_match.group(1)) if year_match else None

    # Month as number.
    month_num_match = re.search(r"\b(0?[1-9]|1[0-2])\b", s)
    if month_num_match:
        month = int(month_num_match.group(1))
        return month, year

    # Month as name.
    month_names = {m.lower(): i for i, m in enumerate(calendar.month_name) if m}
    month_abbr = {m.lower(): i for i, m in enumerate(calendar.month_abbr) if m}
    if s in month_names:
        return month_names[s], year
    if s in month_abbr:
        return month_abbr[s], year

    raise AnalyticsError(f"Unsupported time_period format: {time_period}")


def _month_key_for_year_month(year: int | None, month: int) -> str:
    """
    If year is None, month_key becomes 'YYYY-MM' isn't possible.
    We handle year=None by returning month-only keys; callers should
    filter across all years.
    """
    # Use a placeholder year if year is None; callers must not rely on exact key.
    # For deterministic behavior, we still compute a key with year=2000.
    y = year if year is not None else 2000
    return f"{y:04d}-{month:02d}"


def _monthly_sum_for_period(
    df: pd.DataFrame,
    *,
    date_col: str,
    metric_col: str,
    month: int,
    year: int | None,
) -> float:
    tmp = df.copy()
    tmp["_date"] = _coerce_datetime_series(tmp, date_col)
    tmp["_metric"] = _coerce_numeric_series(tmp, metric_col)
    tmp = tmp.dropna(subset=["_date"])

    if tmp.empty:
        return 0.0

    if year is None:
        filtered = tmp.loc[tmp["_date"].dt.month == month]
    else:
        filtered = tmp.loc[(tmp["_date"].dt.month == month) & (tmp["_date"].dt.year == year)]

    return float(filtered["_metric"].sum())


def _detect_metric_column(df: pd.DataFrame, metric_request: str | None) -> tuple[str, str]:
    """
    Returns (metric_col, metric_kind).
    """
    if not metric_request:
        # Default to revenue-like.
        revenue_col = _detect_column(df, ["Revenue", "Sales", "Amount"])
        if revenue_col is None:
            raise AnalyticsError('Revenue-like column (Revenue/Sales/Amount) not found.')
        return revenue_col, "revenue"

    req = str(metric_request).strip().lower()
    if "profit" in req or "margin" in req:
        profit_col = _detect_column(df, ["Profit", "Margin"])
        if profit_col is None:
            raise AnalyticsError('Profit-like column (Profit/Margin) not found.')
        return profit_col, "profit"

    # Default to revenue-like for 'revenue' or anything else.
    revenue_col = _detect_column(df, ["Revenue", "Sales", "Amount"])
    if revenue_col is None:
        raise AnalyticsError('Revenue-like column (Revenue/Sales/Amount) not found.')
    return revenue_col, "revenue"


def _detect_date_column(df: pd.DataFrame) -> str:
    date_col = _detect_column(df, ["Date", "OrderDate", "InvoiceDate"])
    if date_col is None:
        raise AnalyticsError('Date-like column (Date/OrderDate/InvoiceDate) not found.')
    return date_col


def _detect_entity_columns(df: pd.DataFrame) -> tuple[str | None, str | None]:
    region_col = _detect_column(df, ["Region", "Market", "Territory"])
    product_col = _detect_column(df, ["Product", "Item", "SKU"])
    return region_col, product_col


def analyze(task: dict[str, Any]) -> AnalyzeResponse:
    try:
        operation = str(task.get("operation") or "unknown").lower()
        metric_request = task.get("metric")
        dimension = task.get("dimension")
        entities = task.get("entities")
        filters = task.get("filters")
        time_period = task.get("time_period")
        sort_dir = task.get("sort", "desc")
        limit = task.get("limit")

        # Load dataset
        dataset_path = load_latest_dataset_path()
        df = pd.read_csv(dataset_path)
        if df.empty:
            return AnalyzeResponse(
                analysis_type="unknown", # type: ignore
                results=None,
                error="Dataset is empty; cannot compute analytics.",
            )

        date_col = _detect_date_column(df)
        metric_col, _metric_kind = _detect_metric_column(df, metric_request)
        region_col, product_col = _detect_entity_columns(df)

        def _get_dim_col(dim: str | None) -> str | None:
            if not dim: return None
            if dim == "region": return region_col
            if dim == "product": return product_col
            return _detect_column(df, [dim])

        if operation == "unknown":
            return AnalyzeResponse(analysis_type="unknown", results=None, error="Unsupported operation.") # type: ignore

        if operation == "trend":
            result = compute_revenue_trend(df, metric_col=metric_col, date_col=date_col)
            return AnalyzeResponse(analysis_type="trend", results=result, error=None) # type: ignore

        if operation == "comparison":
            entity_a, entity_b = entities[0], entities[1]

            # Choose entity column based on availability.
            entity_col = None
            for candidate_col in [region_col, product_col]:
                if candidate_col:
                    sample_vals = df[candidate_col].astype(str).str.lower()
                    if (sample_vals == entity_a.lower()).any() or (sample_vals == entity_b.lower()).any():
                        entity_col = candidate_col
                        break
            if entity_col is None:
                entity_col = region_col or product_col
            if entity_col is None:
                return AnalyzeResponse(
                    analysis_type="comparison", # type: ignore
                    results=None,
                    error="No entity column (Region/Product) found for comparison analysis.",
                )

            result = compute_comparison(
                df, metric_col=metric_col, entity_col=entity_col, entity_a=entity_a, entity_b=entity_b
            )
            return AnalyzeResponse(analysis_type="comparison", results=result, error=None) # type: ignore

        if operation == "diagnostic":
            month, year = _parse_month_reference(time_period)
            prev_month = month - 1
            prev_year = year
            if prev_month <= 0:
                prev_month = 12
                prev_year = year - 1 if year is not None else None

            cur_key = _month_key_for_year_month(year, month)
            prev_key = _month_key_for_year_month(prev_year, prev_month)

            if year is None:
                current_value = _monthly_sum_for_period(df, date_col=date_col, metric_col=metric_col, month=month, year=None)
                previous_value = _monthly_sum_for_period(df, date_col=date_col, metric_col=metric_col, month=prev_month, year=None)
                change_percent = None if previous_value == 0 else ((current_value - previous_value) / previous_value) * 100.0

                top_contributor = None
                most_affected_region = None
                most_affected_product = None
                
                if region_col:
                    tmp = df.copy()
                    tmp["_date"] = _coerce_datetime_series(tmp, date_col)
                    tmp["_metric"] = _coerce_numeric_series(tmp, metric_col)
                    tmp = tmp.dropna(subset=["_date"])
                    tmp["_cur_month"] = tmp["_date"].dt.month == month
                    tmp["_prev_month"] = tmp["_date"].dt.month == prev_month
                    cur_group = tmp.loc[tmp["_cur_month"]].groupby(region_col)["_metric"].sum()
                    prev_group = tmp.loc[tmp["_prev_month"]].groupby(region_col)["_metric"].sum()
                    diff = (cur_group - prev_group).fillna(0.0)
                    if not diff.empty:
                        most_affected_region = str(diff.abs().sort_values(ascending=False).index[0])

                if product_col:
                    tmp = df.copy()
                    tmp["_date"] = _coerce_datetime_series(tmp, date_col)
                    tmp["_metric"] = _coerce_numeric_series(tmp, metric_col)
                    tmp = tmp.dropna(subset=["_date"])
                    tmp["_cur_month"] = tmp["_date"].dt.month == month
                    tmp["_prev_month"] = tmp["_date"].dt.month == prev_month
                    cur_group = tmp.loc[tmp["_cur_month"]].groupby(product_col)["_metric"].sum()
                    prev_group = tmp.loc[tmp["_prev_month"]].groupby(product_col)["_metric"].sum()
                    diff = (cur_group - prev_group).fillna(0.0)
                    if not diff.empty:
                        most_affected_product = str(diff.abs().sort_values(ascending=False).index[0])

                top_contributor = most_affected_region or most_affected_product
                return AnalyzeResponse(
                    analysis_type="diagnostic", # type: ignore
                    results={
                        "current_value": current_value,
                        "previous_value": previous_value,
                        "change_percent": change_percent,
                        "top_contributor": top_contributor,
                        "most_affected_region": most_affected_region,
                        "most_affected_product": most_affected_product,
                    },
                    error=None,
                )

            current_value = _monthly_sum_for_period(df, date_col=date_col, metric_col=metric_col, month=month, year=year)
            previous_value = _monthly_sum_for_period(df, date_col=date_col, metric_col=metric_col, month=prev_month, year=prev_year)
            change_percent = None if previous_value == 0 else ((current_value - previous_value) / previous_value) * 100.0

            most_affected_region = None
            most_affected_product = None

            if region_col:
                region_result = compute_diagnostic(df, metric_col=metric_col, date_col=date_col, current_month_key=cur_key, previous_month_key=prev_key, contributor_col=region_col)
                most_affected_region = region_result.get("top_contributor")

            if product_col:
                product_result = compute_diagnostic(df, metric_col=metric_col, date_col=date_col, current_month_key=cur_key, previous_month_key=prev_key, contributor_col=product_col)
                most_affected_product = product_result.get("top_contributor")

            top_contributor = most_affected_region or most_affected_product

            return AnalyzeResponse(
                analysis_type="diagnostic", # type: ignore
                results={
                    "current_value": current_value,
                    "previous_value": previous_value,
                    "change_percent": change_percent,
                    "top_contributor": top_contributor,
                    "most_affected_region": most_affected_region,
                    "most_affected_product": most_affected_product,
                },
                error=None,
            )

        if operation == "forecast":
            try:
                result = compute_forecast(df, metric_col=metric_col, date_col=date_col)
            except Exception as exc:
                return AnalyzeResponse(analysis_type="forecast", results=None, error=str(exc) or "Forecast failed.") # type: ignore
            return AnalyzeResponse(analysis_type="forecast", results=result, error=None) # type: ignore

        if operation in ("ranking", "group_by", "lookup"):
            dim_col = _get_dim_col(dimension) if dimension else None
            
            if operation == "lookup" and filters and "entity" in filters:
                ent = filters["entity"]
                for candidate_col in [region_col, product_col]:
                    if candidate_col:
                        if (df[candidate_col].astype(str).str.lower() == ent.lower()).any():
                            dim_col = candidate_col
                            break
            
            if not dim_col:
                dim_col = product_col or region_col

            if not dim_col:
                return AnalyzeResponse(
                    analysis_type=operation, # type: ignore
                    results=None,
                    error="No entity column found for analysis."
                )

            tmp = df.copy()
            tmp["_metric"] = _coerce_numeric_series(tmp, metric_col)
            
            if operation == "lookup" and filters and "entity" in filters:
                ent = filters["entity"]
                tmp = tmp[tmp[dim_col].astype(str).str.lower() == ent.lower()]

            grouped = tmp.groupby(dim_col)["_metric"].sum()
            
            if sort_dir == "asc":
                grouped = grouped.sort_values(ascending=True)
            else:
                grouped = grouped.sort_values(ascending=False)
            
            if limit:
                grouped = grouped.head(limit)
            
            if grouped.empty:
                return AnalyzeResponse(
                    analysis_type=operation, # type: ignore
                    results=None,
                    error="No data available."
                )
                
            top_entity = str(grouped.index[0])
            top_value = float(grouped.iloc[0])
            
            results = {"top_entity": top_entity, metric_request or _metric_kind: top_value}
            return AnalyzeResponse(analysis_type=operation, results=results, error=None) # type: ignore

        return AnalyzeResponse(analysis_type="unknown", results=None, error="Unsupported analysis_type.") # type: ignore

    except DatasetNotFoundError as exc:
        return AnalyzeResponse(analysis_type="unknown", results=None, error=str(exc)) # type: ignore
    except AnalyticsError as exc:
        return AnalyzeResponse(analysis_type=str(task.get("operation") or "unknown"), results=None, error=str(exc)) # type: ignore
    except Exception as exc:  # pragma: no cover
        return AnalyzeResponse(analysis_type="unknown", results=None, error=f"Analytics failed: {exc}") # type: ignore

