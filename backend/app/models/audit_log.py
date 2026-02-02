"""
Audit Log Model
Stores all auditable events for security and compliance.
"""

from sqlalchemy import Column, String, DateTime, Text, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from .user import Base


class AuditLog(Base):
    """
    Audit log for tracking all sensitive operations.

    This table is append-only - entries should never be modified or deleted
    except through automated retention policies.
    """
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Who performed the action
    user_id = Column(String(255), nullable=False, index=True)

    # What action was performed
    action = Column(String(100), nullable=False, index=True)

    # What resource was affected
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(255), nullable=True)

    # Request context
    ip_address = Column(String(45), nullable=True)  # IPv6 max length
    user_agent = Column(String(500), nullable=True)

    # Additional details (sanitized)
    details = Column(JSONB, nullable=True)

    # Outcome
    status = Column(String(50), default="success", nullable=False)

    # Indexes for common queries
    __table_args__ = (
        Index('ix_audit_logs_user_action', 'user_id', 'action'),
        Index('ix_audit_logs_created_at_desc', created_at.desc()),
        Index('ix_audit_logs_resource', 'resource_type', 'resource_id'),
    )

    def __repr__(self):
        return f"<AuditLog {self.action} by {self.user_id} at {self.created_at}>"
