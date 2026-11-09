from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class PlanStepSchema(BaseModel):
    step_number: int
    title: str
    description: str
    tool_name: Optional[str] = None
    is_sensitive: bool = False


class TaskCreate(BaseModel):
    objective: str = Field(..., min_length=3, description="Task objective in natural language")
    max_iterations: Optional[int] = Field(default=None, ge=1, le=30, description="Optional override for max iterations")
    allow_sensitive_simulation: bool = Field(default=True, description="Whether to allow tools requiring human approval")


class TaskStepResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: str
    step_number: int
    title: str
    description: Optional[str] = None
    tool_name: Optional[str] = None
    status: str
    result: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class ToolExecutionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: str
    step_id: Optional[str] = None
    tool_name: str
    tool_input: Dict[str, Any] = {}
    tool_output: Dict[str, Any] = {}
    duration_ms: int = 0
    is_sensitive: bool = False
    status: str
    error_message: Optional[str] = None
    created_at: datetime


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    objective: str
    status: str
    execution_plan: List[Dict[str, Any]] = []
    current_step_index: int = 0
    final_summary: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    steps: List[TaskStepResponse] = []
    tool_executions: List[ToolExecutionResponse] = []


class TaskSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    objective: str
    status: str
    current_step_index: int = 0
    total_steps: int = 0
    has_pending_approval: bool = False
    has_report: bool = False
    created_at: datetime
    completed_at: Optional[datetime] = None


class DashboardStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    pending_approvals: int
    active_tasks: int
