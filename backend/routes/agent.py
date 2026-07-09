from fastapi import APIRouter, HTTPException
import os
import httpx

from backend.agent.models import (
    AgentQueryRequest,
    AgentQueryResponse,
from backend.agent.response_builder import run_agent_query_pipeline

router = APIRouter(prefix="/agent", tags=["agent"])



@router.post("/query", response_model=AgentQueryResponse)
def query(payload: AgentQueryRequest) -> AgentQueryResponse:
    return run_agent_query_pipeline(payload.query)


