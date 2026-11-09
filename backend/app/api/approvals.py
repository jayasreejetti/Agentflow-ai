from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.models.approval import ApprovalRequest
from app.schemas.approval import ApprovalRequestResponse, ApprovalDecision
from app.services.orchestrator import orchestrator

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.get("", response_model=List[ApprovalRequestResponse])
def list_approvals(
    status: Optional[str] = Query(default=None, description="Filter by status: PENDING, APPROVED, REJECTED"),
    db: Session = Depends(get_db)
):
    """
    List approval requests with optional status filtering.
    """
    query = db.query(ApprovalRequest).order_by(desc(ApprovalRequest.requested_at))
    if status:
        query = query.filter(ApprovalRequest.status == status.upper())
    return query.all()


@router.post("/{approval_id}/approve", response_model=ApprovalRequestResponse)
async def approve_request(
    approval_id: str,
    payload: ApprovalDecision = ApprovalDecision(),
    db: Session = Depends(get_db)
):
    """
    Approve a pending sensitive action and resume the paused LangGraph workflow.
    """
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()

    if not req:
        raise HTTPException(status_code=404, detail="Approval request not found")

    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Request is already resolved as '{req.status}'")

    req.status = "APPROVED"
    req.decision_reason = payload.decision_reason or "Approved by operator"
    req.decided_at = datetime.utcnow()
    db.commit()
    db.refresh(req)

    # Resume the agent graph workflow
    resumed = await orchestrator.resume_with_approval(
        task_id=req.task_id,
        decision="APPROVED",
        reason=req.decision_reason
    )

    if not resumed:
        raise HTTPException(status_code=500, detail="Failed to signal graph orchestrator to resume execution")

    return req


@router.post("/{approval_id}/reject", response_model=ApprovalRequestResponse)
async def reject_request(
    approval_id: str,
    payload: ApprovalDecision = ApprovalDecision(),
    db: Session = Depends(get_db)
):
    """
    Reject a pending sensitive action. The agent will adapt and proceed without executing the sensitive action.
    """
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()

    if not req:
        raise HTTPException(status_code=404, detail="Approval request not found")

    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Request is already resolved as '{req.status}'")

    req.status = "REJECTED"
    req.decision_reason = payload.decision_reason or "Rejected by operator"
    req.decided_at = datetime.utcnow()
    db.commit()
    db.refresh(req)

    # Resume the agent graph workflow with rejection feedback
    resumed = await orchestrator.resume_with_approval(
        task_id=req.task_id,
        decision="REJECTED",
        reason=req.decision_reason
    )

    if not resumed:
        raise HTTPException(status_code=500, detail="Failed to signal graph orchestrator with rejection")

    return req
