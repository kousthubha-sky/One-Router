from sqlalchemy import Column, String, Boolean, TIMESTAMP, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB, BYTEA
from sqlalchemy.sql import func
from datetime import datetime
from .user import Base


class ServiceCredential(Base):
    """
    Service credential model with soft delete support.

    Stores encrypted provider API credentials (Razorpay, Stripe, etc.)
    """
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

    # Soft delete support
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(TIMESTAMP, nullable=True)

    __table_args__ = (
        Index('idx_provider_credentials_user_provider', 'user_id', 'provider_name'),
        # Partial index for active, non-deleted credentials
        Index('idx_provider_credentials_active', 'user_id', 'provider_name', 'is_active',
              postgresql_where=(is_deleted == False)),
    )

    def soft_delete(self):
        """Mark as deleted without removing from database."""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        self.is_active = False

    def restore(self):
        """Restore a soft-deleted credential."""
        self.is_deleted = False
        self.deleted_at = None

    @classmethod
    def active_only(cls):
        """Filter for non-deleted records."""
        return cls.is_deleted == False
