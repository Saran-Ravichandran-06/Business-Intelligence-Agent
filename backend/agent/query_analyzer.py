from __future__ import annotations

import json
import logging
import os
import re
import traceback
from typing import Any

import httpx

from backend.agent.models import AnalyzeQueryResponse, SupportedAnalysisType


SUPPORTED_TYPES: set[str] = {"trend", "comparison", "diagnostic", "forecast", "ranking", "unknown"}
logger = logging.getLogger(__name__)


def _normalize_string(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        v = value.strip()
        return v or None
    return str(value).strip() or None


def _normalize_comparison_entities(text: str | None) -> list[str] | None:
    if not text:
        return None
    # Support "North and South", "North vs South", "North vs. South", "North versus South"
    parts = re.split(r"\s+(and|&|vs\.?|versus)\s+|,", text, flags=re.IGNORECASE)
    separators = {"and", "&", "vs", "vs.", "versus"}
    cleaned_parts = [p.strip() for p in parts if p and p.strip() and p.strip().lower() not in separators]
    
    if len(cleaned_parts) >= 2:
        return [cleaned_parts[0], cleaned_parts[1]]
    
    # Fallback to simple split
    tokens = [t.strip() for t in re.split(r"[;,]", text) if t.strip()]
    if len(tokens) >= 2:
        return [tokens[0], tokens[1]]
        
    return None


def _validate_and_normalize(payload: dict[str, Any]) -> AnalyzeQueryResponse:
    analysis_type_raw = _normalize_string(payload.get("analysis_type"))
    if not analysis_type_raw:
        raise ValueError("Missing required field: analysis_type")
        
    analysis_type = analysis_type_raw.lower()
    if analysis_type not in SUPPORTED_TYPES:
        raise ValueError(f"Invalid analysis_type: {analysis_type}")

    metric = _normalize_string(payload.get("metric"))
    time_period = _normalize_string(payload.get("time_period"))
    comparison_target_raw = _normalize_string(payload.get("comparison_target"))
    
    for field, val in [("metric", metric), ("time_period", time_period), ("comparison_target", comparison_target_raw)]:
        if val is not None and not isinstance(val, str):
            raise ValueError(f"Field {field} must be a string or null")

    normalized_comparison_target: list[str] | str | None = comparison_target_raw
    if analysis_type == "comparison":
        logger.info("Raw comparison_target received: %s", comparison_target_raw)
        normalized_entities = _normalize_comparison_entities(comparison_target_raw)
        if not normalized_entities:
            raise ValueError("Unable to extract two comparison entities from comparison_target.")
        normalized_comparison_target = normalized_entities
        logger.info("Normalized entities for comparison: %s", normalized_comparison_target)

    return AnalyzeQueryResponse(
        analysis_type=analysis_type,  # type: ignore[arg-type]
        metric=metric,
        time_period=time_period,
        comparison_target=normalized_comparison_target,
    )


def _build_prompt(query: str) -> str:
    return f"""Task: Convert the user's question into a JSON object.

Schema:
{{
  "analysis_type": "<trend|comparison|diagnostic|forecast|unknown>",
  "metric": "<string or null>",
  "time_period": "<string or null>",
  "comparison_target": "<string or null>"
}}

User query: {query}
"""


def _deterministic_parse(query: str) -> AnalyzeQueryResponse | None:
    query_lower = query.lower()
    
    # Diagnostic
    match = re.search(r"in\s+([a-zA-Z]+)\s+compared to\s+([a-zA-Z]+)", query_lower, re.IGNORECASE)
    if match and "why" in query_lower and "lower" in query_lower:
        return AnalyzeQueryResponse(
            analysis_type="diagnostic",
            metric="revenue",
            time_period=match.group(1).title(),
            comparison_target=match.group(2).title()
        )
    
    # Comparison
    match = re.search(r"between\s+([a-zA-Z]+)\s+and\s+([a-zA-Z]+)", query_lower, re.IGNORECASE)
    if match and "compare" in query_lower:
        return AnalyzeQueryResponse(
            analysis_type="comparison",
            metric="revenue",
            time_period=None,
            comparison_target=[match.group(1).title(), match.group(2).title()]
        )
        
    # Trend
    if "trend" in query_lower:
        return AnalyzeQueryResponse(
            analysis_type="trend",
            metric="revenue",
            time_period=None,
            comparison_target=None
        )
        
    # Ranking
    ranking_keywords = ["highest", "lowest", "top", "best", "worst", "most", "least"]
    if any(k in query_lower for k in ranking_keywords):
        metric = "profit" if "profit" in query_lower else "revenue"
        entity_type = "product" if "product" in query_lower else "region"
        return AnalyzeQueryResponse(
            analysis_type="ranking",
            metric=metric,
            time_period=None,
            comparison_target=entity_type
        )
        
    # Forecast
    forecast_keywords = ["predict", "forecast", "estimate", "expected", "next month", "next 30 days", "future"]
    if any(k in query_lower for k in forecast_keywords):
        metric = "profit" if "profit" in query_lower else "revenue"
        time_period = "next month"
        if "next 30 days" in query_lower:
            time_period = "next_30_days"
        elif "next" in query_lower:
            match = re.search(r"next\s+([a-zA-Z0-9_]+)", query_lower)
            if match:
                time_period = f"next_{match.group(1)}"
                
        return AnalyzeQueryResponse(
            analysis_type="forecast",
            metric=metric,
            time_period=time_period,
            comparison_target=None
        )
        
    return None

def analyze_query_via_ollama(query: str) -> AnalyzeQueryResponse:
    parsed = _deterministic_parse(query)
    if parsed:
        logger.info("Query matched deterministic rules: %s", parsed)
        return parsed

    ollama_base = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    model = os.getenv("OLLAMA_MODEL", "phi3:latest")

    prompt = _build_prompt(query)
    url = f"{ollama_base}/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "format": "json",
        "stream": False,
        "options": {"temperature": 0},
    }

    logger.info("Ollama QueryAnalyzer request url=%s model=%s", url, model)
    logger.info("Ollama QueryAnalyzer payload=%s", json.dumps(payload, ensure_ascii=False))

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, json=payload)
    except httpx.RequestError as exc:
        logger.exception("Ollama QueryAnalyzer request exception")
        raise RuntimeError(f"Unable to reach Ollama at {url}. Details: {exc}") from exc

    logger.info("Ollama QueryAnalyzer response status=%s", resp.status_code)
    logger.info("Ollama QueryAnalyzer response body=%s", resp.text)

    if resp.status_code >= 400:
        raise RuntimeError(
            f"Ollama request failed with status {resp.status_code}. body={resp.text}"
        )

    try:
        data = resp.json()
    except json.JSONDecodeError as exc:  # pragma: no cover
        logger.error(
            "Ollama QueryAnalyzer JSON decode error traceback=%s",
            traceback.format_exc(),
        )
        raise RuntimeError("Ollama returned invalid JSON.") from exc

    raw_text = data.get("response", "")
    if not isinstance(raw_text, str) or not raw_text.strip():
        raise ValueError("Ollama returned an empty response")

    raw_text = raw_text.strip()
    payload = None
    try:
        payload = json.loads(raw_text)
    except json.JSONDecodeError:
        match = re.search(r'(\{.*?\})', raw_text, re.DOTALL)
        if match:
            json_str = match.group(1)
            # Remove trailing commas from objects and arrays
            json_str = re.sub(r',\s*([\}\]])', r'\1', json_str)
            try:
                payload = json.loads(json_str)
            except json.JSONDecodeError as exc:
                logger.error("Failed to parse extracted JSON object. Extracted: %s", json_str)
                raise ValueError(f"LLM returned malformed JSON: {exc}") from exc
        else:
            raise ValueError("No JSON object could be extracted from the LLM response.")

    if not isinstance(payload, dict):
        raise ValueError("Parsed JSON is not a dictionary.")
        
    logger.info("Ollama QueryAnalyzer extracted JSON payload=%s", payload)

    return _validate_and_normalize(payload)

