import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from starlette.responses import StreamingResponse

from app.database.session import get_db
from app.models.task import Task
from app.models.approval import ApprovalRequest
from app.schemas.task import TaskCreate, TaskResponse, TaskSummaryResponse, DashboardStats
from app.services.orchestrator import orchestrator
from app.services.event_manager import event_manager

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    """
    Create a new autonomous task and immediately dispatch agent execution.
    """
    task_id = str(uuid.uuid4())
    task = Task(
        id=task_id,
        objective=payload.objective.strip(),
        status="PLANNING",
        execution_plan=[],
        current_step_index=0
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Launch workflow orchestration in background
    orchestrator.start_task(
        task_id=task_id,
        objective=payload.objective,
        max_iterations=payload.max_iterations,
        allow_sensitive_simulation=payload.allow_sensitive_simulation
    )

    return task


@router.get("", response_model=List[TaskSummaryResponse])
def list_tasks(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    """
    List previous agent executions ordered by creation date.
    """
    tasks = (
        db.query(Task)
        .order_by(desc(Task.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    summaries = []
    for t in tasks:
        has_pending = any(a.status == "PENDING" for a in (t.approval_requests or []))
        total_steps = len(t.execution_plan) if t.execution_plan else len(t.steps or [])
        summaries.append(
            TaskSummaryResponse(
                id=t.id,
                objective=t.objective,
                status=t.status,
                current_step_index=t.current_step_index,
                total_steps=total_steps,
                has_pending_approval=has_pending,
                has_report=bool(t.reports and len(t.reports) > 0),
                created_at=t.created_at,
                completed_at=t.completed_at
            )
        )

    return summaries


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get aggregated metrics and KPIs for the dashboard.
    """
    tasks = db.query(Task.status).all()
    statuses = [t[0] for t in tasks]

    pending_approvals_count = db.query(ApprovalRequest).filter(ApprovalRequest.status == "PENDING").count()

    total = len(statuses)
    completed = sum(1 for s in statuses if s == "COMPLETED")
    failed = sum(1 for s in statuses if s == "FAILED")
    active = sum(1 for s in statuses if s in ("PLANNING", "EXECUTING", "WAITING_APPROVAL"))

    return DashboardStats(
        total_tasks=total,
        completed_tasks=completed,
        failed_tasks=failed,
        pending_approvals=pending_approvals_count,
        active_tasks=active
    )


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, db: Session = Depends(get_db)):
    """
    Get detailed execution state for a specific task including steps and tool outputs.
    """
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


@router.get("/{task_id}/events")
async def stream_task_events(task_id: str):
    """
    Server-Sent Events (SSE) endpoint delivering real-time agent workflow events.
    """
    return StreamingResponse(
        event_manager.event_generator(task_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
