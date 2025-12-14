"""Initial migration

Revision ID: 001_initial
Revises:
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('clerk_user_id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('company_name', sa.String(), nullable=True),
        sa.Column('plan_tier', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('clerk_user_id')
    )
    op.create_index('idx_users_clerk_user_id', 'users', ['clerk_user_id'], unique=False)

    # Create api_keys table
    op.create_table('api_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('key_hash', sa.String(), nullable=False),
        sa.Column('key_name', sa.String(), nullable=False),
        sa.Column('key_prefix', sa.String(), nullable=False),
        sa.Column('environment', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('rate_limit_per_min', sa.Integer(), nullable=True),
        sa.Column('rate_limit_per_day', sa.Integer(), nullable=True),
        sa.Column('last_used_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('expires_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key_hash')
    )
    op.create_index('idx_api_keys_user_id', 'api_keys', ['user_id'], unique=False)
    op.create_index('idx_api_keys_key_hash', 'api_keys', ['key_hash'], unique=False)

    # Create service_credentials table
    op.create_table('service_credentials',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('service_name', sa.String(), nullable=False),
        sa.Column('environment', sa.String(), nullable=False),
        sa.Column('credentials_encrypted', sa.Text(), nullable=False),
        sa.Column('features_config', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('webhook_secret', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('last_verified_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_service_credentials_user_service_env', 'service_credentials', ['user_id', 'service_name', 'environment'], unique=False)

    # Create transaction_logs table
    op.create_table('transaction_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('api_key_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('transaction_id', sa.String(), nullable=False),
        sa.Column('service_name', sa.String(), nullable=False),
        sa.Column('provider_txn_id', sa.String(), nullable=True),
        sa.Column('endpoint', sa.String(), nullable=False),
        sa.Column('http_method', sa.String(), nullable=False),
        sa.Column('request_payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('response_payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('response_status', sa.Integer(), nullable=True),
        sa.Column('response_time_ms', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('environment', sa.String(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['api_key_id'], ['api_keys.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('transaction_id')
    )
    op.create_index('idx_transaction_logs_user_created', 'transaction_logs', ['user_id', 'created_at'], unique=False)
    op.create_index('idx_transaction_logs_transaction_id', 'transaction_logs', ['transaction_id'], unique=False)
    op.create_index('idx_transaction_logs_service_name', 'transaction_logs', ['service_name'], unique=False)

    # Create webhook_events table
    op.create_table('webhook_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('service_name', sa.String(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('signature', sa.String(), nullable=True),
        sa.Column('processed', sa.Boolean(), nullable=True),
        sa.Column('processed_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('related_txn_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['related_txn_id'], ['transaction_logs.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_webhook_events_user_created', 'webhook_events', ['user_id', 'created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_webhook_events_user_created', table_name='webhook_events')
    op.drop_table('webhook_events')
    op.drop_index('idx_transaction_logs_service_name', table_name='transaction_logs')
    op.drop_index('idx_transaction_logs_transaction_id', table_name='transaction_logs')
    op.drop_index('idx_transaction_logs_user_created', table_name='transaction_logs')
    op.drop_table('transaction_logs')
    op.drop_index('idx_service_credentials_user_service_env', table_name='service_credentials')
    op.drop_table('service_credentials')
    op.drop_index('idx_api_keys_key_hash', table_name='api_keys')
    op.drop_index('idx_api_keys_user_id', table_name='api_keys')
    op.drop_table('api_keys')
    op.drop_index('idx_users_clerk_user_id', table_name='users')
    op.drop_table('users')