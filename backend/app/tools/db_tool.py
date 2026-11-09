from typing import Dict, Any, List, Optional
from app.database.session import SyncSessionLocal
from app.models.task import TaskData


def save_task_data(task_id: str, key: str, value: Any) -> Dict[str, Any]:
    """
    Save key-value data associated with a specific task into SQLite.
    """
    if not task_id or not key:
        return {"success": False, "error": "task_id and key are required"}

    with SyncSessionLocal() as session:
        try:
            # Check if entry with same key exists for this task
            existing = session.query(TaskData).filter(
                TaskData.task_id == task_id,
                TaskData.key == key
            ).first()

            if existing:
                existing.value = value
            else:
                entry = TaskData(task_id=task_id, key=key, value=value)
                session.add(entry)

            session.commit()
            return {
                "success": True,
                "message": f"Saved '{key}' for task {task_id}",
                "key": key,
                "value": value
            }
        except Exception as e:
            session.rollback()
            return {"success": False, "error": f"Database error saving task data: {str(e)}"}


def get_task_data(task_id: str, key: str) -> Dict[str, Any]:
    """
    Retrieve stored key-value data for a task from SQLite.
    """
    if not task_id or not key:
        return {"success": False, "error": "task_id and key are required"}

    with SyncSessionLocal() as session:
        try:
            entry = session.query(TaskData).filter(
                TaskData.task_id == task_id,
                TaskData.key == key
            ).first()

            if not entry:
                return {
                    "success": False,
                    "error": f"No data found for key '{key}' in task {task_id}",
                    "found": False
                }

            return {
                "success": True,
                "found": True,
                "key": key,
                "value": entry.value,
                "stored_at": entry.created_at.isoformat() if entry.created_at else None
            }
        except Exception as e:
            return {"success": False, "error": f"Database error retrieving task data: {str(e)}"}


def list_task_data(task_id: str) -> Dict[str, Any]:
    """
    List all stored key-value pairs for a task.
    """
    if not task_id:
        return {"success": False, "error": "task_id is required"}

    with SyncSessionLocal() as session:
        try:
            entries = session.query(TaskData).filter(TaskData.task_id == task_id).all()
            data_map = {entry.key: entry.value for entry in entries}
            return {
                "success": True,
                "count": len(entries),
                "data": data_map
            }
        except Exception as e:
            return {"success": False, "error": f"Database error listing task data: {str(e)}"}

