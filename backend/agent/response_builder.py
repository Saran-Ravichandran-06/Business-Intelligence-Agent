from __future__ import annotations

from typing import Any
import logging

logger = logging.getLogger(__name__)

from backend.agent.analytics_engine import analyze as analyze_task
from backend.agent.insight_generator import InsightGenerationError, generate_insight
from backend.agent.models import AgentQueryResponse
from backend.agent.query_analyzer import analyze_query_via_ollama


def _build_visualization_data(analysis_type: str, results: dict[str, Any] | None) -> dict[str, Any]:
    if not results:
        return {}

    if analysis_type == "trend":
        labels = results.get("periods", [])
        values = results.get("monthly_values", [])
        return {
            "chart_type": "line",
            "title": "Revenue Trend",
            "labels": labels,
            "datasets": [{"label": "Value", "values": values}],
        }

    if analysis_type == "comparison":
        labels = [results.get("entity_a"), results.get("entity_b")]
        values = [results.get("value_a"), results.get("value_b")]
        return {
            "chart_type": "bar",
            "title": "Comparison",
            "labels": labels,
            "datasets": [{"label": "Value", "values": values}],
        }

    if analysis_type == "diagnostic":
        labels = ["Previous", "Current"]
        values = [results.get("previous_value"), results.get("current_value")]
        return {
            "chart_type": "bar",
            "title": "Diagnostic Change",
            "labels": labels,
            "datasets": [{"label": "Metric Value", "values": values}],
        }

    if analysis_type == "forecast":
        periods = list(results.get("periods_used", []))
        values = []
        # Forecast module returns only predicted value; show prediction point.
        predicted = results.get("predicted_revenue")
        if predicted is not None:
            periods.append(results.get("forecast_period", "next_period"))
            values = [None] * (len(periods) - 1) + [predicted]
        return {
            "chart_type": "line",
            "title": "Forecast",
            "labels": periods,
            "datasets": [{"label": "Predicted Value", "values": values}],
        }

    if analysis_type == "ranking":
        top_entity = results.get("top_region") or results.get("top_product") or "Top"
        metric_key = next((k for k in results if k not in ("top_region", "top_product")), "value")
        metric_val = results.get(metric_key, 0)
        return {
            "chart_type": "bar",
            "title": f"Top {metric_key.replace('_', ' ').title()}",
            "labels": [top_entity],
            "datasets": [{"label": metric_key.replace("_", " ").title(), "values": [metric_val]}],
        }

    return {}


def run_agent_query_pipeline(query: str) -> AgentQueryResponse:
    logger.info("Pipeline Start - Original Query: %s", query)
    try:
        task = analyze_query_via_ollama(query)
        logger.info("Pipeline Step - Parsed JSON: %s", task.model_dump())
    except ValueError as exc:
        logger.error("Pipeline Error - Validation/Parsing failed: %s", exc)
        return AgentQueryResponse(error=str(exc))
    except RuntimeError as exc:
        logger.error("Pipeline Error - LLM request failed: %s", exc)
        return AgentQueryResponse(error=str(exc))

    logger.info("Pipeline Step - Routed Analysis Type: %s", task.analysis_type)
    analysis = analyze_task(task.model_dump())
    if analysis.error:
        logger.error("Pipeline Error - Analytics failed: %s", analysis.error)
        return AgentQueryResponse(
            query_analysis=task,
            analytics_results=None,
            insight=None,
            visualization_data=None,
            error=analysis.error,
        )

    results = analysis.results or {}
    logger.info("Pipeline Step - Analytics Output: %s", results)
    visualization_data = _build_visualization_data(task.analysis_type, results)

    try:
        insight = generate_insight(task.analysis_type, results)
        logger.info("Pipeline Step - Generated Insight: %s", insight)
    except InsightGenerationError as exc:
        logger.error("Pipeline Error - Insight generation failed: %s", exc)
        return AgentQueryResponse(
            query_analysis=task,
            analytics_results=results,
            insight=None,
            visualization_data=visualization_data,
            error=str(exc),
        )

    return AgentQueryResponse(
        query_analysis=task,
        analytics_results=results,
        insight=insight,
        visualization_data=visualization_data,
        error=None,
    )
