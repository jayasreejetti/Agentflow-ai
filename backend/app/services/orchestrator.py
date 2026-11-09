import asyncio
import threading
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from app.core.config import settings
from app.database.session import SyncSessionLocal
from app.models.task import Task
from app.services.event_manager import event_manager
from app.graph.workflow import agent_graph

logger = logging.getLogger("agentflow.orchestrator")


class AgentOrchestrator:
    """
    Manages the lifecycle and state transitions of AgentFlow autonomous executions.
    Handles background execution, state checkpoints, pause-for-approval, and resumption.
    """
    def __init__(self):
        self._running_tasks: Dict[str, asyncio.Task] = {}

    def is_task_running(self, task_id: str) -> bool:
        t = self._running_tasks.get(task_id)
        return t is not None and not t.done()

    def start_task(
        self,
        task_id: str,
        objective: str,
        max_iterations: Optional[int] = None,
        allow_sensitive_simulation: bool = True
    ) -> Optional[asyncio.Task]:
        """Launch autonomous agent workflow execution in background."""
        task_coro = self._execute_task_workflow(
            task_id=task_id,
            objective=objective,
            max_iterations=max_iterations or settings.MAX_AGENT_ITERATIONS,
            allow_sensitive_simulation=allow_sensitive_simulation
        )
        try:
            loop = asyncio.get_running_loop()
            asyncio_task = loop.create_task(task_coro)
            self._running_tasks[task_id] = asyncio_task
            return asyncio_task
        except RuntimeError:
            # When outside active event loop (e.g. tests), dispatch in detached daemon thread
            t = threading.Thread(target=lambda: asyncio.run(task_coro), daemon=True)
            t.start()
            return None

    async def _execute_task_workflow(
        self,
        task_id: str,
        objective: str,
        max_iterations: int,
        allow_sensitive_simulation: bool
    ):
        config = {"configurable": {"thread_id": task_id}}

        initial_state = {
            "task_id": task_id,
            "objective": objective,
            "plan": [],
            "current_step_index": 0,
            "active_tool_call": None,
            "observations": [],
            "sources": [],
            "pending_approval": None,
            "approval_status": None,
            "approval_reason": None,
            "iteration_count": 0,
            "max_iterations": max_iterations,
            "is_completed": False,
            "final_summary": None,
            "report_id": None,
            "error": None,
            "allow_sensitive_simulation": allow_sensitive_simulation
        }

        await event_manager.emit(task_id, "task_started", {
            "task_id": task_id,
            "objective": objective,
            "max_iterations": max_iterations
        })

        try:
            # Execute LangGraph until pause (e.g. human approval) or END
            result = await agent_graph.ainvoke(initial_state, config=config)
            logger.info(f"Task {task_id} workflow step completed. Checkpoint reached: {result.get('is_completed')}")

        except Exception as e:
            logger.error(f"Execution failed for task {task_id}: {str(e)}", exc_info=True)
            self._record_task_failure(task_id, str(e))
            await event_manager.emit(task_id, "task_failed", {
                "task_id": task_id,
                "error": str(e)
            })

    async def resume_with_approval(
        self,
        task_id: str,
        decision: str,  # "APPROVED" or "REJECTED"
        reason: Optional[str] = None
    ) -> bool:
        """
        Resume a paused workflow after a human approval or rejection decision.
        """
        config = {"configurable": {"thread_id": task_id}}

        try:
            # 1. Update the state with the human decision if checkpoint exists
            try:
                await agent_graph.aupdate_state(
                    config,
                    {
                        "approval_status": decision,
                        "approval_reason": reason or "",
                        "pending_approval": None
                    }
                )
            except Exception as checkpoint_err:
                logger.info(f"No existing checkpoint to update for task {task_id}: {checkpoint_err}")

            # 2. Spawn a background task to resume the workflow from checkpoint
            async def _resume():
                try:
                    await agent_graph.ainvoke(None, config=config)
                except Exception as e:
                    logger.error(f"Error resuming task {task_id}: {str(e)}", exc_info=True)
                    self._record_task_failure(task_id, str(e))
                    await event_manager.emit(task_id, "task_failed", {"task_id": task_id, "error": str(e)})

            try:
                loop = asyncio.get_running_loop()
                resume_task = loop.create_task(_resume())
                self._running_tasks[task_id] = resume_task
            except RuntimeError:
                t = threading.Thread(target=lambda: asyncio.run(_resume()), daemon=True)
                t.start()

            return True

        except Exception as e:
            logger.error(f"Failed to resume task {task_id} with approval: {str(e)}")
            return False

    def _record_task_failure(self, task_id: str, error_message: str):
        with SyncSessionLocal() as session:
            try:
                task = session.query(Task).filter(Task.id == task_id).first()
                if task:
                    task.status = "FAILED"
                    task.error_message = error_message
                    task.completed_at = datetime.utcnow()
                    session.commit()
            except Exception:
                session.rollback()


orchestrator = AgentOrchestrator()
