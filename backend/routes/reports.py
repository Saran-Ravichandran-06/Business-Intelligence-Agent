from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from backend.services.export_service import build_csv_summary_bytes, build_pdf_bytes
from backend.services.report_service import ReportError, generate_report, get_last_report

router = APIRouter(prefix="/reports", tags=["reports"])


class GenerateReportRequest(BaseModel):
    report_type: str


@router.post("/generate")
def generate(payload: GenerateReportRequest) -> dict:
    try:
        return generate_report(payload.report_type)
    except ReportError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/download/pdf")
def download_pdf() -> Response:
    try:
        report = get_last_report()
        pdf_bytes = build_pdf_bytes(report)
    except ReportError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    filename = f"bi_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/download/csv")
def download_csv() -> Response:
    try:
        report = get_last_report()
        csv_bytes = build_csv_summary_bytes(report)
    except ReportError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    filename = f"bi_report_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
