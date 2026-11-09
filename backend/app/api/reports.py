from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.models.report import GeneratedReport
from app.schemas.report import GeneratedReportResponse, ReportSummaryResponse

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=List[ReportSummaryResponse])
def list_reports(db: Session = Depends(get_db)):
    """
    List all autonomously generated research reports.
    """
    reports = db.query(GeneratedReport).order_by(desc(GeneratedReport.created_at)).all()

    return [
        ReportSummaryResponse(
            id=r.id,
            task_id=r.task_id,
            title=r.title,
            sources_count=len(r.sources or []),
            created_at=r.created_at
        )
        for r in reports
    ]


@router.get("/{report_id}", response_model=GeneratedReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    """
    Retrieve full Markdown content, metadata, and sources for a report.
    """
    report = db.query(GeneratedReport).filter(GeneratedReport.id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return report


@router.get("/{report_id}/download")
def download_report_markdown(report_id: str, db: Session = Depends(get_db)):
    """
    Download report content as a downloadable Markdown (.md) file.
    """
    report = db.query(GeneratedReport).filter(GeneratedReport.id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    filename = f"{report.title.lower().replace(' ', '_')[:40]}.md"
    return Response(
        content=report.content_markdown,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
