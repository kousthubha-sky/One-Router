from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from .user import Base


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    key_hash = Column(String, unique=True, nullable=False)
    key_name = Column(String, nullable=False)
    key_prefix = Column(String, nullable=False)
    environment = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    rate_limit_per_min = Column(Integer, default=60)
    rate_limit_per_day = Column(Integer, default=10000)
    last_used_at = Column(TIMESTAMP, nullable=True)
    expires_at = Column(TIMESTAMP, nullable=True)
    rotated_at = Column(TIMESTAMP, nullable=True, comment="Timestamp of last key rotation")
    rotation_required = Column(Boolean, default=False, comment="Whether rotation is required")
    rotated_from_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id"), nullable=True, comment="ID of previous key if rotated")
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index('idx_api_keys_user_id', 'user_id'),
        Index('idx_api_keys_key_hash', 'key_hash'),
        Index('idx_api_keys_active', 'is_active'),
        Index('idx_api_keys_rotation_required', 'rotation_required'),
    )
