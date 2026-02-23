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
    SUBSCRIPTION = "subscription"


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
    transaction_type = Column(SQLEnum(TransactionType, native_enum=True, name='transaction_type'), nullable=False)
    payment_id = Column(String, nullable=True)  # Reference to one_router_payments.id
    description = Column(String, nullable=True)
    extra_data = Column(JSONB, nullable=True, server_default='{}')  # Renamed from 'metadata'
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
    provider = Column(String(50), nullable=False)  # 'razorpay', 'paypal', 'dodo'
    provider_payment_id = Column(String, nullable=True)  # Razorpay payment_id
    provider_order_id = Column(String, nullable=True)  # Razorpay order_id
    status = Column(SQLEnum(PaymentStatus, native_enum=True, name='payment_status'), nullable=False, default=PaymentStatus.PENDING)
    error_message = Column(String, nullable=True)
    checkout_url = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index('idx_one_router_payments_user', 'user_id'),
        Index('idx_one_router_payments_status', 'status'),
        Index('idx_one_router_payments_provider', 'provider'),
    )


class SubscriptionStatus(str, enum.Enum):
    """Status of subscriptions"""
    PENDING = "pending"
    ACTIVE = "active"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"
    EXPIRED = "expired"


class Subscription(Base):
    """Track user subscriptions"""
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    plan_id = Column(String(50), nullable=False)  # 'sub_pro', 'sub_team', 'sub_enterprise'
    plan_name = Column(String(100), nullable=False)
    provider = Column(String(50), nullable=False)  # 'razorpay', 'dodo'
    provider_subscription_id = Column(String, nullable=True)
    provider_order_id = Column(String, nullable=True)  # Razorpay payment_link_id, Dodo order_id
    provider_payment_id = Column(String, nullable=True)  # Razorpay payment_id for completed payments
    credits_per_month = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    status = Column(SQLEnum(SubscriptionStatus, native_enum=True, name='subscription_status'), nullable=False, default=SubscriptionStatus.PENDING)
    current_period_start = Column(TIMESTAMP, nullable=True)
    current_period_end = Column(TIMESTAMP, nullable=True)
    cancel_at_period_end = Column(Integer, nullable=False, default=0)  # 1 = yes, 0 = no
    cancelled_at = Column(TIMESTAMP, nullable=True)
    ended_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index('idx_subscriptions_user', 'user_id'),
        Index('idx_subscriptions_status', 'status'),
        Index('idx_subscriptions_provider', 'provider'),
    )
