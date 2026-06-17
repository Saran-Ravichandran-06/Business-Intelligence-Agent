from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from backend.agent.insight_generator import InsightGenerationError, generate_insight
from backend.services.dashboard_service import (
    DashboardError,
    calculate_kpis,
    region_analysis,
    revenue_trend_analysis,
    top_products_analysis,
)


class ReportError(Exception):
    pass


_LAST_REPORT: dict[str, Any] | None = None


def _report_store_path() -> Path:
    base = Path(__file__).resolve().parents[1] / "data"
    base.mkdir(parents=True, exist_ok=True)
    return base / "latest_report.json"


def _build_summary(report_type: str, kpis: dict[str, Any], top_region: str | None, top_product: str | None) -> str:
    return (
        f"{report_type.capitalize()} report generated from current dataset. "
        f"Total revenue: {kpis.get('total_revenue', 0):,.2f}. "
        f"Total orders: {kpis.get('total_orders', 0)}. "
        f"Top-performing region: {top_region or 'N/A'}. "
        f"Top-performing product: {top_product or 'N/A'}."
    )


def _select_limit(report_type: str) -> int:
    if report_type == "monthly":
        return 5
    if report_type == "quarterly":
        return 8
    return 10


def generate_report(report_type: str) -> dict[str, Any]:
    if report_type not in {"monthly", "quarterly", "full_dataset"}:
        raise ReportError("Unsupported report_type. Use monthly, quarterly, or full_dataset.")

    try:
        k = calculate_kpis()
        trend = revenue_trend_analysis()
        products = top_products_analysis(limit=_select_limit(report_type))
        regions = region_analysis()
    except DashboardError as exc:
        raise ReportError(str(exc)) from exc

    kpis = {
        "total_revenue": k.total_revenue,
        "total_orders": k.total_orders,
        "total_profit": k.total_profit,
        "unique_products": k.unique_products,
        "top_region": regions[0]["region"] if regions else None,
        "top_product": products[0]["product"] if products else None,
    }

    charts = [
        {
            "chart_type": "line",
            "title": "Revenue Trend",
            "labels": [x["date"] for x in trend],
            "values": [x["revenue"] for x in trend],
        },
        {
            "chart_type": "bar",
            "title": "Top Products",
            "labels": [x["product"] for x in products],
            "values": [x["revenue"] for x in products],
        },
        {
            "chart_type": "bar",
            "title": "Region Performance",
            "labels": [x["region"] for x in regions],
            "values": [x["revenue"] for x in regions],
        },
    ]

    insights: list[str] = []
    try:
        trend_payload = {
            "trend_direction": "increasing" if len(trend) > 1 and trend[-1]["revenue"] >= trend[0]["revenue"] else "decreasing",
            "start_value": trend[0]["revenue"] if trend else None,
            "end_value": trend[-1]["revenue"] if trend else None,
        }
        insights.append(generate_insight("trend", trend_payload))
    except InsightGenerationError:
        insights.append("Trend insight unavailable because local Phi-3 is not reachable.")

    try:
        compare_payload = {
            "top_region": kpis["top_region"],
            "top_region_revenue": regions[0]["revenue"] if regions else None,
            "second_region": regions[1]["region"] if len(regions) > 1 else None,
            "second_region_revenue": regions[1]["revenue"] if len(regions) > 1 else None,
        }
        insights.append(generate_insight("comparison", compare_payload))
    except InsightGenerationError:
        insights.append("Comparison insight unavailable because local Phi-3 is not reachable.")

    report = {
        "report_type": report_type,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": _build_summary(report_type, kpis, kpis["top_region"], kpis["top_product"]),
        "kpis": kpis,
        "charts": charts,
        "insights": insights,
    }

    global _LAST_REPORT
    _LAST_REPORT = report
    _report_store_path().write_text(json.dumps(report, ensure_ascii=False), encoding="utf-8")
    return report


def get_last_report() -> dict[str, Any]:
    if _LAST_REPORT is not None:
        return _LAST_REPORT

    path = _report_store_path()
    if not path.exists():
        raise ReportError("No report generated yet.")

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise ReportError("Latest report file is corrupted.") from exc

    if not isinstance(data, dict):
        raise ReportError("Latest report file is invalid.")

    return data
