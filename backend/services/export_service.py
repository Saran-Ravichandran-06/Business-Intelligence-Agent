from __future__ import annotations

import csv
import io
from datetime import datetime
from typing import Any

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


def build_pdf_bytes(report: dict[str, Any]) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    content = []

    content.append(Paragraph("AI BI Analyst Report", styles["Title"]))
    content.append(Spacer(1, 12))
    content.append(Paragraph(f"Type: {report.get('report_type', 'N/A')}", styles["Normal"]))
    content.append(Paragraph(f"Generated: {report.get('generated_at', '')}", styles["Normal"]))
    content.append(Spacer(1, 12))
    content.append(Paragraph("Executive Summary", styles["Heading2"]))
    content.append(Paragraph(report.get("summary", "N/A"), styles["Normal"]))
    content.append(Spacer(1, 12))

    content.append(Paragraph("Key KPIs", styles["Heading2"]))
    for k, v in (report.get("kpis") or {}).items():
        content.append(Paragraph(f"{k}: {v}", styles["Normal"]))
    content.append(Spacer(1, 12))

    content.append(Paragraph("Charts", styles["Heading2"]))
    for chart in report.get("charts", []):
        content.append(Paragraph(f"{chart.get('title')}: {len(chart.get('labels', []))} points", styles["Normal"]))
    content.append(Spacer(1, 12))

    content.append(Paragraph("AI Insights", styles["Heading2"]))
    for insight in report.get("insights", []):
        content.append(Paragraph(insight, styles["Normal"]))
        content.append(Spacer(1, 6))

    doc.build(content)
    return buf.getvalue()


def build_csv_summary_bytes(report: dict[str, Any]) -> bytes:
    out = io.StringIO()
    writer = csv.writer(out)

    writer.writerow(["section", "key", "value"])
    writer.writerow(["meta", "report_type", report.get("report_type")])
    writer.writerow(["meta", "generated_at", report.get("generated_at")])
    writer.writerow(["summary", "text", report.get("summary")])

    for k, v in (report.get("kpis") or {}).items():
        writer.writerow(["kpi", k, v])

    for i, insight in enumerate(report.get("insights", []), start=1):
        writer.writerow(["insight", f"insight_{i}", insight])

    return out.getvalue().encode("utf-8")
