"""Add missing database indexes for performance

Revision ID: add_missing_indexes
Revises: add_api_key_rotation
Create Date: 2025-01-10 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'add_missing_indexes'
down_revision = 'add_api_key_rotation'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add partial index on transaction_logs for completed transactions
    # This index speeds up queries filtering by status='completed' alongside user_id and created_at
    op.create_index(
        'idx_transaction_logs_user_created_completed',
        'transaction_logs',
        ['user_id', 'created_at'],
        postgresql_where=text("status = 'completed'")
    )

    # Add partial index on webhook_events for unprocessed events
    # Speeds up queries checking for webhooks that need processing
    op.create_index(
        'idx_webhook_events_service_unprocessed',
        'webhook_events',
        ['service_name', 'processed'],
        postgresql_where=text("processed = false")
    )

    # Add partial index on api_keys for active keys only
    # Significantly reduces index size while improving queries for valid API keys
    op.create_index(
        'idx_api_keys_user_active',
        'api_keys',
        ['user_id', 'is_active'],
        postgresql_where=text("is_active = true")
    )


def downgrade() -> None:
    op.drop_index('idx_api_keys_user_active', table_name='api_keys')
    op.drop_index('idx_webhook_events_service_unprocessed', table_name='webhook_events')
    op.drop_index('idx_transaction_logs_user_created_completed', table_name='transaction_logs')
