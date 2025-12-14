from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, Text, UUID, ForeignKey, JSON, Index, text, FetchedValue
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from uuid import uuid4

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    clerk_id = Column(String, unique=True, nullable=False)
    email = Column(String, nullable=False)
    name = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    key_hash = Column(String, unique=True, nullable=False)
    key_name = Column(String, nullable=False)
    key_prefix = Column(String, nullable=False)  # unf_test/live
    environment = Column(String, nullable=False)  # test/live
    is_active = Column(Boolean, default=True)
    rate_limit_per_min = Column(Integer, default=60)
    rate_limit_per_day = Column(Integer, default=10000)
    last_used_at = Column(TIMESTAMP)
    expires_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        Index('idx_api_keys_user_id', 'user_id'),
        Index('idx_api_keys_key_hash', 'key_hash'),
    )

class ServiceCredential(Base):
    __tablename__ = "provider_credentials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    provider_name = Column(String, nullable=False)  # razorpay/paypal/twilio/stripe
    credential_key_id = Column(String)
    encrypted_credential = Column(Text, nullable=False)  # AES-256 encrypted JSON (stored as text)
    is_active = Column(Boolean, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('idx_provider_credentials_user_provider', 'user_id', 'provider_name'),
        {'schema': None}
    )

class TransactionLog(Base):
    __tablename__ = "transaction_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id"))
    transaction_id = Column(String, unique=True, nullable=False)
    service_name = Column(String, nullable=False)
    provider_txn_id = Column(String)
    endpoint = Column(String, nullable=False)
    http_method = Column(String, nullable=False)
    request_payload = Column(JSON)
    response_payload = Column(JSON)
    response_status = Column(Integer)
    response_time_ms = Column(Integer)
    status = Column(String, nullable=False)  # success/failed
    error_message = Column(Text)
    ip_address = Column(String)
    user_agent = Column(Text)
    environment = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        Index('idx_transaction_logs_user_created', 'user_id', 'created_at'),
        Index('idx_transaction_logs_transaction_id', 'transaction_id'),
        Index('idx_transaction_logs_service_name', 'service_name'),
    )

class RateLimitTracking(Base):
    __tablename__ = "rate_limit_tracking"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id"), nullable=False)
    window_start = Column(TIMESTAMP, nullable=False)
    request_count = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        Index('idx_rate_limit_tracking_api_key_window', 'api_key_id', 'window_start'),
    )

class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    service_name = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    payload = Column(JSON, nullable=False)
    signature = Column(String)
    processed = Column(Boolean, default=False)
    processed_at = Column(TIMESTAMP)
    related_txn_id = Column(UUID(as_uuid=True), ForeignKey("transaction_logs.id"))
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        Index('idx_webhook_events_user_created', 'user_id', 'created_at'),
    )