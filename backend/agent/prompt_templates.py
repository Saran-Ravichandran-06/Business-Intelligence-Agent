from __future__ import annotations

import json
from typing import Any


def build_insight_prompt(analysis_type: str, results: dict[str, Any]) -> str:
    analytics_json = json.dumps(results, ensure_ascii=False, separators=(",", ":"))

    return f"""You are a Business Intelligence Analyst.

Use ONLY the supplied analytics results.
Do not calculate anything.
Do not invent information.
Do not assume missing data.
Do not include markdown.
Do not include bullet points.
Do not include recommendations unless directly implied by provided fields.

analysis_type: {analysis_type}
analytics_results: {analytics_json}

Write a concise business insight in 2-4 short sentences.
Only mention facts present in analytics_results.
"""
