"""merge heads 10dd7550a7bd and c3d4e5f6a7b8

Revision ID: f1e2d3c4b5a6
Revises: 10dd7550a7bd, c3d4e5f6a7b8
Create Date: 2026-04-25 13:00:00.000000

This is a merge migration to resolve multiple head revisions present
in the repository. It intentionally contains no schema changes.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "f1e2d3c4b5a6"
down_revision: Union[str, Sequence[str], None] = ("10dd7550a7bd", "c3d4e5f6a7b8")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Merge-only migration: no DB changes required.
    pass


def downgrade() -> None:
    # Downgrade would be non-trivial for a merge; keep as no-op.
    pass
