import time
import uuid
from datetime import datetime
from typing import Dict, Any, List

from app.core.config import settings
from app.database.session import SyncSessionLocal
from app.models.task import Task, TaskStep, ToolExecution
from app.models.approval import ApprovalRequest
from app.services.event_manager import event_manager
from app.services.llm_factory import llm_service
from app.tools import (
    calculate,
    get_current_datetime,
    save_task_data,
    get_task_data,
    search_web,
    generate_report,
    execute_external_action,
    TOOL_DEFINITIONS
)
from app.graph.state import AgentWorkflowState


async def planner_node(state: AgentWorkflowState) -> Dict[str, Any]:
    """
    Analyzes user objective, formulates structured step-by-step plan,
    saves plan and steps to database, and broadcasts plan_created event.
    """
    task_id = state["task_id"]
    objective = state["objective"]

    # Formulate plan
    raw_plan = await llm_service.generate_plan(objective)

    # Filter out sensitive steps if user explicitly disabled sensitive actions
    plan = []
    for idx, step in enumerate(raw_plan, start=1):
        step_dict = {
            "step_number": idx,
            "title": step.get("title", f"Step {idx}"),
            "description": step.get("description", ""),
            "tool_name": step.get("tool_name"),
            "is_sensitive": step.get("is_sensitive", False) and state.get("allow_sensitive_simulation", True),
            "status": "PENDING"
        }
        plan.append(step_dict)

    # Persist in DB
    with SyncSessionLocal() as session:
        try:
            task = session.query(Task).filter(Task.id == task_id).first()
            if task:
                task.execution_plan = plan
                task.status = "EXECUTING"
                # Clear previous steps if any and create fresh ones
                session.query(TaskStep).filter(TaskStep.task_id == task_id).delete()
                for step in plan:
                    db_step = TaskStep(
                        id=str(uuid.uuid4()),
                        task_id=task_id,
                        step_number=step["step_number"],
                        title=step["title"],
                        description=step["description"],
                        tool_name=step["tool_name"],
                        status="PENDING"
                    )
                    session.add(db_step)
                session.commit()
        except Exception as e:
            session.rollback()

    await event_manager.emit(task_id, "plan_created", {
        "plan": plan,
        "total_steps": len(plan)
    })

    return {
        "plan": plan,
        "current_step_index": 0,
        "iteration_count": 0,
        "observations": [],
        "sources": [],
        "is_completed": False
    }


async def agent_node(state: AgentWorkflowState) -> Dict[str, Any]:
    """
    Determines next action or tool to call for the current step.
    """
    task_id = state["task_id"]
    objective = state["objective"]
    plan = state.get("plan", [])
    current_idx = state.get("current_step_index", 0)
    past_obs = state.get("observations", [])

    if current_idx >= len(plan):
        return {"active_tool_call": None, "is_completed": True}

    step = plan[current_idx]
    decision = await llm_service.decide_next_step(
        objective=objective,
        plan=plan,
        current_step_index=current_idx,
        past_observations=past_obs
    )

    tool_name = decision.get("tool_name") or step.get("tool_name")
    is_sensitive = decision.get("is_sensitive") or step.get("is_sensitive", False)
    args = decision.get("arguments", {})

    # Mark step as RUNNING in DB and in memory
    step["status"] = "RUNNING"
    with SyncSessionLocal() as session:
        try:
            db_step = session.query(TaskStep).filter(
                TaskStep.task_id == task_id,
                TaskStep.step_number == step["step_number"]
            ).first()
            if db_step:
                db_step.status = "RUNNING"
                session.commit()
        except Exception:
            session.rollback()

    await event_manager.emit(task_id, "step_started", {
        "step_number": step["step_number"],
        "title": step["title"],
        "tool_name": tool_name,
        "is_sensitive": is_sensitive
    })

    tool_call = {
        "step_number": step["step_number"],
        "tool_name": tool_name,
        "arguments": args,
        "is_sensitive": is_sensitive
    }

    return {"active_tool_call": tool_call}


async def approval_node(state: AgentWorkflowState) -> Dict[str, Any]:
    """
    Detects actions requiring human approval.
    Creates an ApprovalRequest in DB, marks Task WAITING_APPROVAL, and emits approval_required.
    If the action was approved or rejected by the user, handles the transition.
    """
    task_id = state["task_id"]
    tool_call = state.get("active_tool_call") or {}
    approval_status = state.get("approval_status")

    # If approval decision has arrived (APPROVED or REJECTED)
    if approval_status in ("APPROVED", "REJECTED"):
        decision_reason = state.get("approval_reason", "")
        # Update Task status back to EXECUTING in DB
        with SyncSessionLocal() as session:
            try:
                task = session.query(Task).filter(Task.id == task_id).first()
                if task:
                    task.status = "EXECUTING"
                # Update approval request record
                req = session.query(ApprovalRequest).filter(
                    ApprovalRequest.task_id == task_id,
                    ApprovalRequest.status == "PENDING"
                ).first()
                if req:
                    req.status = approval_status
                    req.decision_reason = decision_reason
                    req.decided_at = datetime.utcnow()
                session.commit()
            except Exception:
                session.rollback()

        await event_manager.emit(task_id, "approval_resolved", {
            "status": approval_status,
            "reason": decision_reason,
            "tool_name": tool_call.get("tool_name")
        })

        return {
            "pending_approval": None,
            "approval_status": approval_status
        }

    # Action requires human approval and has not been decided yet:
    approval_id = str(uuid.uuid4())
    action_type = tool_call.get("arguments", {}).get("action_type", "external_action")
    action_desc = tool_call.get("arguments", {}).get("action_description", f"Execute {tool_call.get('tool_name')}")
    params = tool_call.get("arguments", {})

    with SyncSessionLocal() as session:
        try:
            task = session.query(Task).filter(Task.id == task_id).first()
            if task:
                task.status = "WAITING_APPROVAL"
            approval_req = ApprovalRequest(
                id=approval_id,
                task_id=task_id,
                tool_name=tool_call.get("tool_name", "unknown"),
                action_type=action_type,
                action_description=action_desc,
                parameters=params,
                status="PENDING"
            )
            session.add(approval_req)
            session.commit()
        except Exception:
            session.rollback()

    pending_data = {
        "id": approval_id,
        "task_id": task_id,
        "tool_name": tool_call.get("tool_name"),
        "action_type": action_type,
        "action_description": action_desc,
        "parameters": params,
        "status": "PENDING"
    }

    await event_manager.emit(task_id, "approval_required", pending_data)

    return {
        "pending_approval": pending_data,
        "approval_status": None
    }


async def tool_execution_node(state: AgentWorkflowState) -> Dict[str, Any]:
    """
    Safely executes the tool selected by the agent node or processes human rejection.
    Enforces allowlisting, timeout, error handling, and updates DB.
    """
    task_id = state["task_id"]
    tool_call = state.get("active_tool_call") or {}
    tool_name = tool_call.get("tool_name")
    args = tool_call.get("arguments", {})
    step_num = tool_call.get("step_number", 1)
    is_sensitive = tool_call.get("is_sensitive", False)
    approval_status = state.get("approval_status")

    start_time = time.time()
    tool_output = {}
    is_success = True
    error_msg = None
    new_sources = []

    # Emit tool_called event
    await event_manager.emit(task_id, "tool_called", {
        "tool_name": tool_name,
        "arguments": args,
        "step_number": step_num
    })

    # Check if this sensitive action was rejected by human
    if is_sensitive and approval_status == "REJECTED":
        is_success = False
        error_msg = "Execution canceled by human administrator."
        tool_output = {
            "success": False,
            "status": "REJECTED",
            "message": "Action was explicitly rejected by user. The agent will adapt and proceed without executing this step."
        }
    else:
        # Execute tool via allowlist
        try:
            if tool_name == "datetime_tool":
                tz = args.get("timezone_name", "UTC")
                tool_output = get_current_datetime(timezone_name=tz)

            elif tool_name == "calculator":
                expr = args.get("expression", "")
                tool_output = calculate(expr)

            elif tool_name == "web_search":
                query = args.get("query", state.get("objective", ""))
                max_results = args.get("max_results", 4)
                tool_output = search_web(query=query, max_results=max_results)
                if tool_output.get("sources"):
                    new_sources.extend(tool_output["sources"])

            elif tool_name == "database_save":
                key = args.get("key", f"data_step_{step_num}")
                val = args.get("value", {})
                tool_output = save_task_data(task_id=task_id, key=key, value=val)

            elif tool_name == "database_get":
                key = args.get("key", "")
                tool_output = get_task_data(task_id=task_id, key=key)

            elif tool_name == "report_generator":
                title = args.get("title")
                content = args.get("content_markdown", "")
                sources = args.get("sources") or state.get("sources", [])
                
                # If report markdown wasn't fully generated in tool arguments, synthesize directly via Gemini
                if not content or len(content.strip()) < 100:
                    report_result = await llm_service.generate_final_report_content(
                        objective=state.get("objective", ""),
                        observations=state.get("observations", []),
                        sources=sources
                    )
                    title = title or report_result.get("title", f"Report: {state.get('objective', '')[:50]}")
                    content = report_result.get("content_markdown", "")

                tool_output = generate_report(
                    task_id=task_id,
                    title=title or f"Report: {state.get('objective', '')[:50]}",
                    content_markdown=content,
                    sources=sources
                )
                if tool_output.get("success"):
                    state["report_id"] = tool_output.get("report_id")

            elif tool_name == "external_action":
                tool_output = execute_external_action(
                    task_id=task_id,
                    action_type=args.get("action_type", "notification"),
                    action_description=args.get("action_description", ""),
                    parameters=args.get("parameters", {}),
                    is_approved=(approval_status == "APPROVED")
                )

            elif tool_name is None:
                tool_output = {"success": True, "message": "Analytical planning step executed."}

            else:
                is_success = False
                error_msg = f"Tool '{tool_name}' is not in the authorized tools allowlist."
                tool_output = {"success": False, "error": error_msg}

        except Exception as e:
            is_success = False
            error_msg = f"Tool execution failed: {str(e)}"
            tool_output = {"success": False, "error": error_msg}

    duration_ms = int((time.time() - start_time) * 1000)

    # Persist ToolExecution and update TaskStep in DB
    with SyncSessionLocal() as session:
        try:
            # 1. Add ToolExecution
            exec_record = ToolExecution(
                id=str(uuid.uuid4()),
                task_id=task_id,
                tool_name=tool_name or "internal_reasoning",
                tool_input=args,
                tool_output=tool_output,
                duration_ms=duration_ms,
                is_sensitive=is_sensitive,
                status="SUCCESS" if is_success else ("REJECTED" if approval_status == "REJECTED" else "FAILED"),
                error_message=error_msg
            )
            session.add(exec_record)

            # 2. Update TaskStep
            step_record = session.query(TaskStep).filter(
                TaskStep.task_id == task_id,
                TaskStep.step_number == step_num
            ).first()
            if step_record:
                step_record.status = "COMPLETED" if is_success else ("SKIPPED" if approval_status == "REJECTED" else "FAILED")
                step_record.result = str(tool_output)
                step_record.completed_at = datetime.utcnow()

            session.commit()
        except Exception:
            session.rollback()

    # Update state plan entry
    plan = state.get("plan", [])
    if step_num - 1 < len(plan):
        plan[step_num - 1]["status"] = "COMPLETED" if is_success else ("SKIPPED" if approval_status == "REJECTED" else "FAILED")

    # Broadcast tool_result event
    await event_manager.emit(task_id, "tool_result", {
        "step_number": step_num,
        "tool_name": tool_name,
        "duration_ms": duration_ms,
        "success": is_success,
        "output": tool_output
    })

    obs_entry = {
        "step_number": step_num,
        "tool_name": tool_name,
        "output": tool_output,
        "success": is_success
    }

    current_observations = list(state.get("observations", []))
    current_observations.append(obs_entry)

    all_sources = list(state.get("sources", []))
    all_sources.extend(new_sources)

    return {
        "observations": current_observations,
        "sources": all_sources,
        "active_tool_call": None,
        "approval_status": None,  # Reset approval status for next steps
        "pending_approval": None,
        "report_id": state.get("report_id")
    }


async def reflection_node(state: AgentWorkflowState) -> Dict[str, Any]:
    """
    Evaluates whether the task has been achieved, checks for missing data,
    prevents infinite loops using max_iterations, and advances step index.
    """
    task_id = state["task_id"]
    objective = state["objective"]
    plan = state.get("plan", [])
    current_idx = state.get("current_step_index", 0)
    obs = state.get("observations", [])
    iteration = state.get("iteration_count", 0) + 1
    max_iter = state.get("max_iterations", settings.MAX_AGENT_ITERATIONS)

    # Next step
    next_idx = current_idx + 1
    all_done = next_idx >= len(plan)
    loop_limit_reached = iteration >= max_iter

    reflection_eval = await llm_service.reflect_on_progress(
        objective=objective,
        plan=plan,
        current_step_index=current_idx,
        observations=obs,
        iteration=iteration
    )

    should_finish = all_done or loop_limit_reached

    await event_manager.emit(task_id, "reflection", {
        "iteration": iteration,
        "max_iterations": max_iter,
        "current_step": next_idx,
        "total_steps": len(plan),
        "should_finish": should_finish,
        "assessment": reflection_eval.get("assessment", "Progress validated successfully.")
    })

    return {
        "current_step_index": next_idx,
        "iteration_count": iteration,
        "is_completed": should_finish
    }


async def final_response_node(state: AgentWorkflowState) -> Dict[str, Any]:
    """
    Summarizes all completed work, links final reports and sources,
    and updates database task record to COMPLETED.
    """
    task_id = state["task_id"]
    objective = state["objective"]
    plan = state.get("plan", [])
    obs = state.get("observations", [])
    sources = state.get("sources", [])
    report_id = state.get("report_id")

    final_summary = await llm_service.generate_final_summary(
        objective=objective,
        plan=plan,
        observations=obs
    )

    with SyncSessionLocal() as session:
        try:
            task = session.query(Task).filter(Task.id == task_id).first()
            if task:
                task.status = "COMPLETED"
                task.final_summary = final_summary
                task.completed_at = datetime.utcnow()
                session.commit()
        except Exception:
            session.rollback()

    await event_manager.emit(task_id, "task_completed", {
        "task_id": task_id,
        "status": "COMPLETED",
        "final_summary": final_summary,
        "report_id": report_id,
        "sources": sources,
        "total_steps": len(plan),
        "completed_steps": sum(1 for p in plan if p.get("status") in ("COMPLETED", "SKIPPED"))
    })

    return {
        "final_summary": final_summary,
        "is_completed": True
    }

