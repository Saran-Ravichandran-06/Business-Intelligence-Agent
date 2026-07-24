from __future__ import annotations

import logging
import re
from typing import Any

from backend.agent.models import AnalyzeQueryResponse, BusinessRequest, SupportedOperation

logger = logging.getLogger(__name__)

def _normalize_dimension(text: str | None) -> str | None:
    if not text:
        return None
    t = text.lower().strip()
    if "region" in t or "territory" in t or "market" in t:
        return "region"
    if "product" in t or "item" in t or "sku" in t:
        return "product"
    return t

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

def normalize(intent: AnalyzeQueryResponse) -> BusinessRequest:
    operation: SupportedOperation = intent.analysis_type # type: ignore
    metric = intent.metric
    time_period = intent.time_period
    raw_target = intent.comparison_target

    if isinstance(raw_target, list):
        raw_target = " and ".join(raw_target)

    dimension = None
    entities = None
    filters = None
    limit = None
    sort = None

    if operation == "comparison":
        entities = _normalize_comparison_entities(raw_target)
        if not entities or len(entities) != 2:
            raise ValueError(f"Comparison operation requires exactly two entities. Found: {entities}")

    elif operation == "group_by":
        dimension = _normalize_dimension(raw_target)
        if not dimension:
            raise ValueError("Group By operation requires a dimension.")

    elif operation == "lookup":
        # E.g. "Sales of Product A" -> filter by product=A or region=A
        if raw_target:
            filters = {"entity": raw_target}
        if not filters:
            raise ValueError("Lookup operation requires at least one filter.")

    elif operation == "ranking":
        dimension = _normalize_dimension(raw_target)
        limit = 5
        sort = "desc"

    logger.info("Normalized BusinessRequest: operation=%s, dimension=%s, entities=%s, filters=%s", operation, dimension, entities, filters)

    return BusinessRequest(
        operation=operation,
        metric=metric,
        dimension=dimension,
        entities=entities,
        filters=filters,
        time_period=time_period,
        sort=sort, # type: ignore
        limit=limit
    )
