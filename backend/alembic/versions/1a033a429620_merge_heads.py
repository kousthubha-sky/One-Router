"""merge_heads

Revision ID: 1a033a429620
Revises: env_segregation_001, add_missing_indexes
Create Date: 2025-12-26 14:09:08.966071

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1a033a429620'
down_revision: Union[str, None] = ('env_segregation_001', 'add_missing_indexes')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
