from fastapi import APIRouter, HTTPException
import os
import httpx

from backend.agent.models import (
    AgentQueryRequest,
    AgentQueryResponse,
    AnalyzeQueryRequest,
    AnalyzeQueryResponse,
    AnalyzeRequest,
    AnalyzeResponse,
    GenerateInsightRequest,
    GenerateInsightResponse,
)
from backend.agent.query_analyzer import analyze_query_via_ollama
from backend.agent.analytics_engine import analyze as analyze_task
from backend.agent.insight_generator import InsightGenerationError, generate_insight
from backend.agent.response_builder import run_agent_query_pipeline

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/analyze-query", response_model=AnalyzeQueryResponse)
def analyze_query(payload: AnalyzeQueryRequest) -> AnalyzeQueryResponse:
    try:
        return analyze_query_via_ollama(payload.query)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    # Analytics engine only performs deterministic calculations.
    return analyze_task(payload.model_dump())


@router.post("/generate-insight", response_model=GenerateInsightResponse)
def generate(payload: GenerateInsightRequest) -> GenerateInsightResponse:
    try:
        insight = generate_insight(payload.analysis_type, payload.results)
        if not insight.strip():
            raise InsightGenerationError("Insight generation returned empty text.")
        return GenerateInsightResponse(insight=insight)
    except InsightGenerationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/query", response_model=AgentQueryResponse)
def query(payload: AgentQueryRequest) -> AgentQueryResponse:
    return run_agent_query_pipeline(payload.query)


@router.get("/test-ollama")
def test_ollama() -> dict:
    ollama_base = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    url = f"{ollama_base}/api/generate"
    payload = {
        "model": "phi3:latest",
        "prompt": "Say hello",
        "stream": False,
    }
    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, json=payload)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"Ollama request error: {exc}") from exc

    body: str | dict
    try:
        body = resp.json()
    except ValueError:
        body = resp.text

    return {
        "request_url": url,
        "request_payload": payload,
        "status_code": resp.status_code,
        "response": body,
    }
