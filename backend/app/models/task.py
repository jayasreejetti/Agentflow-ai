import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    objective = Column(Text, nullable=False)
    status = Column(String(30), default="PENDING", index=True)  # PENDING, PLANNING, EXECUTING, WAITING_APPROVAL, COMPLETED, FAILED
    execution_plan = Column(JSON, default=list)  # List of planned steps
    current_step_index = Column(Integer, default=0)
    final_summary = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    steps = relationship("TaskStep", back_populates="task", cascade="all, delete-orphan", order_by="TaskStep.step_number")
    tool_executions = relationship("ToolExecution", back_populates="task", cascade="all, delete-orphan", order_by="ToolExecution.created_at")
    approval_requests = relationship("ApprovalRequest", back_populates="task", cascade="all, delete-orphan")
    reports = relationship("GeneratedReport", back_populates="task", cascade="all, delete-orphan")
    data_entries = relationship("TaskData", back_populates="task", cascade="all, delete-orphan")


class TaskStep(Base):
    __tablename__ = "task_steps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id"), nullable=False, index=True)
    step_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    tool_name = Column(String(50), nullable=True)
    status = Column(String(30), default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED, SKIPPED
    result = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    task = relationship("Task", back_populates="steps")


class ToolExecution(Base):
    __tablename__ = "tool_executions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id"), nullable=False, index=True)
    step_id = Column(String(36), ForeignKey("task_steps.id"), nullable=True)
    tool_name = Column(String(50), nullable=False)
    tool_input = Column(JSON, default=dict)
    tool_output = Column(JSON, default=dict)
    duration_ms = Column(Integer, default=0)
    is_sensitive = Column(Boolean, default=False)
    status = Column(String(30), default="SUCCESS")  # SUCCESS, FAILED, PENDING_APPROVAL, REJECTED
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="tool_executions")


class TaskData(Base):
    """Task-scoped database key-value storage used by Database Tool"""
    __tablename__ = "task_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String(36), ForeignKey("tasks.id"), nullable=False, index=True)
    key = Column(String(100), nullable=False, index=True)
    value = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="data_entries")

