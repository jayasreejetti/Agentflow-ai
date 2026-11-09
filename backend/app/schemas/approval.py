from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ApprovalDecision(BaseModel):
    decision_reason: Optional[str] = Field(default=None, description="Optional explanation or context for approval/rejection")


class ApprovalRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: str
    tool_execution_id: Optional[str] = None
    tool_name: str
    action_type: str
    action_description: str
    parameters: Dict[str, Any] = {}
    status: str  # PENDING, APPROVED, REJECTED
    decision_reason: Optional[str] = None
    requested_at: datetime
    decided_at: Optional[datetime] = None
