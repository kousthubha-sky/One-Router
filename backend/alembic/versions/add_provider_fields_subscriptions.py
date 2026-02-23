"""add_provider_fields_to_subscriptions

Revision ID: add_provider_fields
Revises: 9aba0676c496
Create Date: 2025-02-23

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_provider_fields'
down_revision: Union[str, None] = '9aba0676c496'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add missing columns to subscriptions table
    # Using raw SQL to avoid errors if columns already exist
    conn = op.get_bind()

    try:
        conn.execute(sa.text('ALTER TABLE subscriptions ADD COLUMN provider_order_id VARCHAR'))
    except Exception:
        pass  # Column might already exist

    try:
        conn.execute(sa.text('ALTER TABLE subscriptions ADD COLUMN provider_payment_id VARCHAR'))
    except Exception:
        pass  # Column might already exist


def downgrade() -> None:
    # Drop columns
    conn = op.get_bind()

    try:
        conn.execute(sa.text('ALTER TABLE subscriptions DROP COLUMN provider_payment_id'))
    except Exception:
        pass

    try:
        conn.execute(sa.text('ALTER TABLE subscriptions DROP COLUMN provider_order_id'))
    except Exception:
        pass


