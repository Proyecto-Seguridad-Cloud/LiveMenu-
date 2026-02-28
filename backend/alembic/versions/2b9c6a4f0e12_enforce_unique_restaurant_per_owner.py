"""enforce unique restaurant per owner

Revision ID: 2b9c6a4f0e12
Revises: 8e3af6fd3a91
Create Date: 2026-02-28 10:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2b9c6a4f0e12"
down_revision: Union[str, None] = "8e3af6fd3a91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            DELETE FROM restaurants r
            USING (
                SELECT id
                FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at ASC, id ASC) AS rn
                    FROM restaurants
                ) ranked
                WHERE ranked.rn > 1
            ) duplicates
            WHERE r.id = duplicates.id
            """
        )
    )

    op.create_unique_constraint(
        "uq_restaurants_owner_id",
        "restaurants",
        ["owner_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_restaurants_owner_id", "restaurants", type_="unique")
