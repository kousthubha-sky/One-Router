from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Numeric, Enum as SQLEnum, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from .user import Base
import enum


class TransactionType(str, enum.Enum):
    """Types of credit transactions"""
    PURCHASE = "purchase"
    CONSUMPTION = "consumption"
    REFUND = "refund"
    BONUS = "bonus"


class PaymentStatus(str, enum.Enum):
    """Status of OneRouter payments"""
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"


class UserCredit(Base):
    """Track user credit balances"""
    __tablename__ = "user_credits"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True, nullable=False)
    balance = Column(Integer, nullable=False, default=1000)  # Free tier: 1000 credits
    total_purchased = Column(Integer, nullable=False, default=0)
    total_consumed = Column(Integer, nullable=False, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index('idx_user_credits_balance', 'balance'),
    )


class CreditTransaction(Base):
    """Track credit transactions (purchases, consumption, refunds, bonuses)"""
    __tablename__ = "credit_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False)  # Positive = purchase/refund/bonus, Negative = consumption
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    payment_id = Column(String, nullable=True)  # Reference to one_router_payments.id
    description = Column(String, nullable=True)
    metadata = Column(JSONB, nullable=True, server_default='{}')
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    __table_args__ = (
        Index('idx_credit_transactions_user_created', 'user_id', 'created_at'),
        Index('idx_credit_transactions_type', 'transaction_type'),
    )


class OneRouterPayment(Base):
    """Track payments to OneRouter itself (credit purchases)"""
    __tablename__ = "one_router_payments"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)  # Payment amount in currency
    currency = Column(String(3), nullable=False, default="INR")
    credits_purchased = Column(Integer, nullable=False)  # Number of credits bought
    provider = Column(String(50), nullable=False)  # 'razorpay', 'paypal'
    provider_payment_id = Column(String, nullable=True)  # Razorpay payment_id
    provider_order_id = Column(String, nullable=True)  # Razorpay order_id
    status = Column(SQLEnum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    error_message = Column(String, nullable=True)
    checkout_url = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index('idx_one_router_payments_user', 'user_id'),
        Index('idx_one_router_payments_status', 'status'),
        Index('idx_one_router_payments_provider', 'provider'),
    )
