from typing import TypedDict, List, Dict, Any, Optional


class AgentWorkflowState(TypedDict, total=False):
    task_id: str
    objective: str
    plan: List[Dict[str, Any]]
    current_step_index: int
    active_tool_call: Optional[Dict[str, Any]]
    observations: List[Dict[str, Any]]
    sources: List[Dict[str, Any]]
    pending_approval: Optional[Dict[str, Any]]
    approval_status: Optional[str]  # None, "APPROVED", "REJECTED"
    approval_reason: Optional[str]
    iteration_count: int
    max_iterations: int
    is_completed: bool
    final_summary: Optional[str]
    report_id: Optional[str]
    error: Optional[str]
    allow_sensitive_simulation: bool

