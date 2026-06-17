from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

SupportedAnalysisType = Literal[
    "trend",
    "comparison",
    "diagnostic",
    "forecast",
    "ranking",
    "unknown",
]


class AnalyzeQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)


class AnalyzeQueryResponse(BaseModel):
    analysis_type: SupportedAnalysisType
    metric: str | None = None
    time_period: str | None = None
    comparison_target: list[str] | str | None = None


class AnalyzeRequest(BaseModel):
    analysis_type: SupportedAnalysisType
    metric: str | None = None
    time_period: str | None = None
    comparison_target: list[str] | str | None = None


class AnalyzeResponse(BaseModel):
    analysis_type: SupportedAnalysisType
    results: dict[str, Any] | None = None
    error: str | None = None


class GenerateInsightRequest(BaseModel):
    analysis_type: SupportedAnalysisType
    results: dict[str, Any]


class GenerateInsightResponse(BaseModel):
    insight: str


class AgentQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)


class AgentQueryResponse(BaseModel):
    query_analysis: AnalyzeQueryResponse | None = None
    analytics_results: dict[str, Any] | None = None
    insight: str | None = None
    visualization_data: dict[str, Any] | None = None
    error: str | None = None
