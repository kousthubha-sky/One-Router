from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from .user import Base


class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id"), nullable=False)
    idempotency_key = Column(String, nullable=False)
    endpoint = Column(String, nullable=False)
    request_hash = Column(String, nullable=False)  # SHA256 hash of request body
    response_body = Column(Text, nullable=True)  # JSON response body
    response_status_code = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    expires_at = Column(TIMESTAMP, nullable=False)

    __table_args__ = (
        Index('idx_idempotency_keys_api_key_idempotency', 'api_key_id', 'idempotency_key'),
        Index('idx_idempotency_keys_expires_at', 'expires_at'),
    )