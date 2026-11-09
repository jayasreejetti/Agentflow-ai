import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id"), nullable=False, index=True)
    tool_execution_id = Column(String(36), nullable=True)
    tool_name = Column(String(50), nullable=False)
    action_type = Column(String(100), nullable=False)
    action_description = Column(Text, nullable=False)
    parameters = Column(JSON, default=dict)
    status = Column(String(30), default="PENDING", index=True)  # PENDING, APPROVED, REJECTED
    decision_reason = Column(Text, nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow)
    decided_at = Column(DateTime, nullable=True)

    task = relationship("Task", back_populates="approval_requests")

