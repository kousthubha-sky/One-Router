"""add_credits_system

Revision ID: add_credits_001
Revises: e7d4f554727d
Create Date: 2025-01-21

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_credits_001'
down_revision: Union[str, None] = 'e7d4f554727d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create user_credits table
    op.create_table(
        'user_credits',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('balance', sa.Integer(), nullable=False, server_default='1000'),
        sa.Column('total_purchased', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_consumed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )
    op.create_index('idx_user_credits_balance', 'user_credits', ['balance'])

    # Create credit_transactions table
    op.create_table(
        'credit_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.func.gen_random_uuid(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('transaction_type', sa.Enum('purchase', 'consumption', 'refund', 'bonus', name='transaction_type'), nullable=False),
        sa.Column('payment_id', sa.String(), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_credit_transactions_user_created', 'credit_transactions', ['user_id', 'created_at'])
    op.create_index('idx_credit_transactions_type', 'credit_transactions', ['transaction_type'])

    # Create one_router_payments table
    op.create_table(
        'one_router_payments',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.func.gen_random_uuid(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='INR'),
        sa.Column('credits_purchased', sa.Integer(), nullable=False),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('provider_payment_id', sa.String(), nullable=True),
        sa.Column('provider_order_id', sa.String(), nullable=True),
        sa.Column('status', sa.Enum('pending', 'success', 'failed', 'refunded', name='payment_status'), nullable=False, server_default='pending'),
        sa.Column('error_message', sa.String(), nullable=True),
        sa.Column('checkout_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_one_router_payments_user', 'one_router_payments', ['user_id'])
    op.create_index('idx_one_router_payments_status', 'one_router_payments', ['status'])
    op.create_index('idx_one_router_payments_provider', 'one_router_payments', ['provider'])


def downgrade() -> None:
    # Drop indexes first
    op.drop_index('idx_one_router_payments_provider', 'one_router_payments')
    op.drop_index('idx_one_router_payments_status', 'one_router_payments')
    op.drop_index('idx_one_router_payments_user', 'one_router_payments')

    op.drop_index('idx_credit_transactions_type', 'credit_transactions')
    op.drop_index('idx_credit_transactions_user_created', 'credit_transactions')

    op.drop_index('idx_user_credits_balance', 'user_credits')

    # Drop tables
    op.drop_table('one_router_payments')
    op.drop_table('credit_transactions')
    op.drop_table('user_credits')

    # Drop enums (if they exist)
    try:
        sa.Enum(name='payment_status').drop(op.get_bind())
    except Exception:
        pass
    try:
        sa.Enum(name='transaction_type').drop(op.get_bind())
    except Exception:
        pass
