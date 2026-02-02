"""
Webhook Queue Model
Stores webhooks for reliable delivery with retries.
"""

from sqlalchemy import Column, String, DateTime, Integer, Text, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid

from .user import Base


class WebhookQueue(Base):
    """
    Queue for webhook deliveries with retry support.

    Webhooks are processed by a background worker that:
    1. Picks up PENDING/RETRYING webhooks where next_attempt_at <= now
    2. Attempts delivery
    3. Updates status and schedules retry on failure
    """
    __tablename__ = "webhook_queue"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Who owns this webhook
    user_id = Column(String(255), nullable=False, index=True)

    # Webhook configuration
    webhook_url = Column(Text, nullable=False)
    payload = Column(JSONB, nullable=False)
    event_type = Column(String(100), nullable=False)
    service_name = Column(String(100), nullable=False)

    # Idempotency
    idempotency_key = Column(String(255), nullable=True, unique=True)

    # Status tracking
    status = Column(String(50), default="pending", nullable=False, index=True)
    # pending -> retrying -> delivered/exhausted/failed

    # Retry tracking
    attempt_count = Column(Integer, default=0, nullable=False)
    next_attempt_at = Column(DateTime, nullable=True, index=True)
    last_attempt_at = Column(DateTime, nullable=True)
    last_status_code = Column(Integer, nullable=True)
    last_error = Column(Text, nullable=True)

    # Success tracking
    delivered_at = Column(DateTime, nullable=True)

    # Indexes for efficient querying
    __table_args__ = (
        Index('ix_webhook_queue_pending', 'status', 'next_attempt_at'),
        Index('ix_webhook_queue_user_status', 'user_id', 'status'),
    )

    def __repr__(self):
        return f"<WebhookQueue {self.event_type} status={self.status} attempts={self.attempt_count}>"
