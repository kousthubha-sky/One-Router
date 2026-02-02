from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, Index, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from datetime import datetime
from .user import Base


class TransactionLog(Base):
    """
    Transaction log for all API calls through OneRouter.

    Supports soft delete for data retention compliance.
    Large tables should use time-based partitioning (see migrations).
    """
    __tablename__ = "transaction_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id"), nullable=True)
    transaction_id = Column(String, unique=True, nullable=False)
    idempotency_key = Column(String, nullable=True)
    service_name = Column(String, nullable=False)
    provider_txn_id = Column(String, nullable=True)
    endpoint = Column(String, nullable=False)
    http_method = Column(String, nullable=False)
    request_payload = Column(JSONB, nullable=True)
    response_payload = Column(JSONB, nullable=True)
    response_status = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    status = Column(String, nullable=False)
    error_message = Column(Text, nullable=True)
    cost = Column(Integer, nullable=True)
    currency = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    environment = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    # Soft delete support
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(TIMESTAMP, nullable=True)

    __table_args__ = (
        Index('idx_transaction_logs_user_created', 'user_id', 'created_at'),
        Index('idx_transaction_logs_transaction_id', 'transaction_id'),
        Index('idx_transaction_logs_service_name', 'service_name'),
        Index('idx_transaction_logs_idempotency_key', 'idempotency_key'),
        # Partial index for active records (most queries)
        Index('idx_transaction_logs_active', 'user_id', 'created_at',
              postgresql_where=(is_deleted == False)),
    )

    def soft_delete(self):
        """Mark as deleted without removing from database."""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()

    def restore(self):
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.deleted_at = None

    @classmethod
    def active_only(cls):
        """Filter for non-deleted records."""
        return cls.is_deleted == False
