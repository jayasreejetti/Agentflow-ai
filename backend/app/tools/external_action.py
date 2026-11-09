from typing import Dict, Any


def execute_external_action(
    task_id: str,
    action_type: str,
    action_description: str,
    parameters: Dict[str, Any],
    is_approved: bool = False
) -> Dict[str, Any]:
    """
    Simulated external action tool (e.g. creating external task, drafting a broadcast notification, or dispatching alert).
    Marked as sensitive: requires human approval before execution.
    """
    if not is_approved:
        return {
            "success": False,
            "requires_approval": True,
            "action_type": action_type,
            "action_description": action_description,
            "parameters": parameters,
            "message": "Action paused. Waiting for human administrator approval."
        }

    # If approved by human:
    return {
        "success": True,
        "action_type": action_type,
        "status": "EXECUTED",
        "parameters": parameters,
        "message": f"Successfully executed external action '{action_type}': {action_description} (Simulated).",
        "audit_trail": {
            "task_id": task_id,
            "authorized": True,
            "action": action_type
        }
    }

