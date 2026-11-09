import uuid
import pytest
from fastapi import HTTPException
from app.database.session import SessionLocal, init_db
from app.api.health import check_health
from app.api.tasks import create_task, get_task, list_tasks, get_dashboard_stats
from app.api.approvals import list_approvals, approve_request, reject_request
from app.api.reports import list_reports, get_report
from app.models.approval import ApprovalRequest
from app.models.report import GeneratedReport
from app.schemas.task import TaskCreate
from app.schemas.approval import ApprovalDecision


def setup_module():
    init_db()


def test_health_endpoint():
    with SessionLocal() as db:
        res = check_health(db)
        assert res["status"] in ("healthy", "degraded")
        assert "providers" in res
        assert "safety" in res
        assert res["database"]["connected"] is True


def test_task_creation_and_retrieval():
    with SessionLocal() as db:
        payload = TaskCreate(
            objective="Research three AI companies and compare their models",
            allow_sensitive_simulation=True
        )
        created = create_task(payload, db)
        assert created.id is not None
        assert created.status in ("PLANNING", "EXECUTING", "WAITING_APPROVAL", "COMPLETED")

        # Retrieve task
        task = get_task(created.id, db)
        assert task.id == created.id
        assert "three AI companies" in task.objective


def test_task_listing():
    with SessionLocal() as db:
        tasks = list_tasks(limit=10, offset=0, db=db)
        assert isinstance(tasks, list)
        assert len(tasks) >= 1


def test_dashboard_stats():
    with SessionLocal() as db:
        stats = get_dashboard_stats(db)
        assert stats.total_tasks >= 1
        assert stats.completed_tasks >= 0
        assert stats.pending_approvals >= 0


def test_approval_workflow():
    with SessionLocal() as db:
        appr_id = f"test-appr-{uuid.uuid4()}"
        approval = ApprovalRequest(
            id=appr_id,
            task_id="test-task-id",
            tool_name="external_action",
            action_type="draft_notification",
            action_description="Test broadcast alert",
            parameters={"subject": "Quarterly Review"},
            status="PENDING"
        )
        db.add(approval)
        db.commit()

        # List approvals
        pending_list = list_approvals(status="PENDING", db=db)
        assert any(a.id == appr_id for a in pending_list)

        # Test rejection
        coro = reject_request(
            approval_id=appr_id,
            payload=ApprovalDecision(decision_reason="Policy disallows external broadcast"),
            db=db
        )
        try:
            coro.send(None)
        except StopIteration as e:
            updated = e.value
            assert updated.status == "REJECTED"
            assert "Policy disallows" in updated.decision_reason


def test_report_endpoints():
    with SessionLocal() as db:
        rep_id = f"test-rep-{uuid.uuid4()}"
        report = GeneratedReport(
            id=rep_id,
            task_id="test-task-id",
            title="AI Market Analysis Report",
            content_markdown="# Market Analysis\n\nContent here.",
            sources=[{"title": "OpenAI", "url": "https://openai.com"}]
        )
        db.add(report)
        db.commit()

        # List reports
        all_reports = list_reports(db=db)
        assert any(r.id == rep_id for r in all_reports)

        # Get specific report
        single_report = get_report(rep_id, db=db)
        assert single_report.title == "AI Market Analysis Report"
        assert len(single_report.sources) == 1


def test_not_found_errors():
    with SessionLocal() as db:
        with pytest.raises(HTTPException) as exc_info:
            get_task("non-existent-task-id", db)
        assert exc_info.value.status_code == 404

        with pytest.raises(HTTPException) as exc_info:
            get_report("non-existent-report-id", db)
        assert exc_info.value.status_code == 404
