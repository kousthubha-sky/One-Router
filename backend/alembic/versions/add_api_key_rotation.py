"""Add API key rotation and encryption support

Revision ID: add_api_key_rotation
Revises: 784224d1b2f6
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_api_key_rotation'
down_revision = '784224d1b2f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add rotation fields to api_keys table for key rotation support"""
    
    # Add rotation tracking columns
    op.add_column('api_keys', sa.Column('rotated_at', sa.TIMESTAMP(), nullable=True,
                                        comment='Timestamp of last key rotation'))
    op.add_column('api_keys', sa.Column('rotation_required', sa.Boolean(), default=False,
                                        comment='Whether rotation is required'))
    op.add_column('api_keys', sa.Column('rotated_from_id', postgresql.UUID(as_uuid=True), nullable=True,
                                        comment='ID of previous key if rotated'))
    op.add_column('api_keys', sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('now()'),
                                        nullable=False))
    
    # Add foreign key constraint for rotated_from_id
    op.create_foreign_key('fk_api_keys_rotated_from_id', 'api_keys', 'api_keys',
                         ['rotated_from_id'], ['id'])
    
    # Create indexes for rotation fields
    op.create_index('idx_api_keys_rotation_required', 'api_keys', ['rotation_required'])
    op.create_index('idx_api_keys_active', 'api_keys', ['is_active'])


def downgrade() -> None:
    """Remove rotation fields from api_keys table"""
    
    # Drop indexes
    op.drop_index('idx_api_keys_rotation_required', table_name='api_keys')
    op.drop_index('idx_api_keys_active', table_name='api_keys')
    
    # Drop foreign key
    op.drop_constraint('fk_api_keys_rotated_from_id', 'api_keys', type_='foreignkey')
    
    # Drop columns
    op.drop_column('api_keys', 'updated_at')
    op.drop_column('api_keys', 'rotated_from_id')
    op.drop_column('api_keys', 'rotation_required')
    op.drop_column('api_keys', 'rotated_at')
