from sqlalchemy import Column, String, Boolean, TIMESTAMP, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB, BYTEA
from sqlalchemy.sql import func
from .user import Base


class ServiceCredential(Base):
    __tablename__ = "provider_credentials"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    provider_name = Column(String, nullable=False)
    environment = Column(String, nullable=False)
    encrypted_credential = Column(BYTEA, nullable=False)
    features_config = Column(JSONB, nullable=False, server_default='{}')
    webhook_secret = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    last_verified_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index('idx_provider_credentials_user_provider', 'user_id', 'provider_name'),
    )
