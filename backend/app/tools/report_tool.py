import uuid
from typing import Dict, Any, List, Optional
from app.database.session import SyncSessionLocal
from app.models.report import GeneratedReport


def generate_report(
    task_id: str,
    title: str,
    content_markdown: str,
    sources: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Generate and save a structured Markdown report in SQLite.
    """
    if not task_id or not title or not content_markdown:
        return {"success": False, "error": "task_id, title, and content_markdown are required"}

    sources_list = sources or []
    report_id = str(uuid.uuid4())

    with SyncSessionLocal() as session:
        try:
            report = GeneratedReport(
                id=report_id,
                task_id=task_id,
                title=title.strip(),
                content_markdown=content_markdown.strip(),
                sources=sources_list
            )
            session.add(report)
            session.commit()

            return {
                "success": True,
                "report_id": report_id,
                "title": title,
                "word_count": len(content_markdown.split()),
                "sources_count": len(sources_list),
                "message": f"Report '{title}' generated and stored successfully."
            }
        except Exception as e:
            session.rollback()
            return {"success": False, "error": f"Failed to persist report: {str(e)}"}

