from typing import List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class GeneratedReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: str
    title: str
    content_markdown: str
    sources: List[Dict[str, Any]] = []
    created_at: datetime


class ReportSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: str
    title: str
    sources_count: int
    created_at: datetime
