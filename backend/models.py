from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from uuid import uuid4

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    clerk_user_id = Column(String, unique=True, nullable=False)
    email = Column(String, nullable=False)
    name = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index('idx_users_clerk_user_id', 'clerk_user_id'),
    )


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
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        Index('idx_api_keys_user_id', 'user_id'),
        Index('idx_api_keys_key_hash', 'key_hash'),
    )


class ServiceCredential(Base):
    __tablename__ = "service_credentials"  # FIXED: was provider_credentials

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    service_name = Column(String, nullable=False)
    environment = Column(String, nullable=False)
    credentials_encrypted = Column(Text, nullable=False)
    features_config = Column(JSONB, nullable=False, server_default='{}')
    webhook_secret = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    last_verified_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('idx_service_credentials_user_service_env', 'user_id', 'service_name', 'environment'),
    )


class TransactionLog(Base):
    __tablename__ = "transaction_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id"), nullable=True)
    transaction_id = Column(String, unique=True, nullable=False)
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
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    environment = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        Index('idx_transaction_logs_user_created', 'user_id', 'created_at'),
        Index('idx_transaction_logs_transaction_id', 'transaction_id'),
        Index('idx_transaction_logs_service_name', 'service_name'),
    )


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    service_name = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    payload = Column(JSONB, nullable=False)
    signature = Column(String, nullable=True)
    processed = Column(Boolean, default=False)
    processed_at = Column(TIMESTAMP, nullable=True)
    related_txn_id = Column(UUID(as_uuid=True), ForeignKey("transaction_logs.id"), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        Index('idx_webhook_events_user_created', 'user_id', 'created_at'),
    )