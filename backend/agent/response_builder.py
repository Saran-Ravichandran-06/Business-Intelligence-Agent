from __future__ import annotations

from typing import Any
import logging

logger = logging.getLogger(__name__)

from backend.agent.analytics_engine import analyze as analyze_task
from backend.agent.insight_generator import InsightGenerationError, generate_insight
from backend.agent.models import AgentQueryResponse
from backend.agent.query_analyzer import analyze_query_via_ollama
from backend.agent.normalization_layer import normalize


def _build_visualization_data(analysis_type: str, results: dict[str, Any] | None) -> dict[str, Any]:
    if not results:
        return {}

    dist = results.get("distribution", [])
    summary = results.get("summary", {})
    metric_label = summary.get("metric_label", "Value").replace("_", " ").title()

    if not dist:
        return {}

    labels = [str(d.get("label", "")) for d in dist]
    values = [d.get("value") for d in dist]

    if analysis_type in ("trend", "forecast"):
        return {
            "chart_type": "line",
            "title": f"{metric_label} {analysis_type.title()}",
            "labels": labels,
            "datasets": [{"label": metric_label, "values": values}],
        }
    
    title = f"{metric_label} Distribution"
    if analysis_type == "ranking":
        title = f"Top {metric_label}"
    elif analysis_type == "comparison":
        title = f"Comparison of {metric_label}"
    elif analysis_type == "diagnostic":
        title = f"Diagnostic Change in {metric_label}"

    return {
        "chart_type": "bar",
        "title": title,
        "labels": labels,
        "datasets": [{"label": metric_label, "values": values}],
    }


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

    try:
        business_request = normalize(task)
        logger.info("Pipeline Step - Normalized Request: %s", business_request.model_dump())
    except ValueError as exc:
        logger.error("Pipeline Error - Normalization failed: %s", exc)
        return AgentQueryResponse(error=str(exc))

    logger.info("Pipeline Step - Routed Analysis Type: %s", business_request.operation)
    analysis = analyze_task(business_request.model_dump())
    if analysis.error:
        logger.error("Pipeline Error - Analytics failed: %s", analysis.error)
        return AgentQueryResponse(
            query_analysis=task,
            analytics_results=None,
            insight=None,
            visualization_data=None,
            error=analysis.error,
        )

    results_dict = analysis.results.model_dump() if analysis.results else {}
    logger.info("Pipeline Step - Analytics Output: %s", results_dict)
    visualization_data = _build_visualization_data(business_request.operation, results_dict)

    try:
        insight = generate_insight(business_request.operation, results_dict)
        logger.info("Pipeline Step - Generated Insight: %s", insight)
    except InsightGenerationError as exc:
        logger.error("Pipeline Error - Insight generation failed: %s", exc)
        return AgentQueryResponse(
            query_analysis=task,
            analytics_results=results_dict,
            insight=None,
            visualization_data=visualization_data,
            error=str(exc),
        )

    return AgentQueryResponse(
        query_analysis=task,
        analytics_results=results_dict,
        insight=insight,
        visualization_data=visualization_data,
        error=None,
    )
