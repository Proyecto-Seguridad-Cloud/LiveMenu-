"""add ondelete cascade to foreign keys

Revision ID: c3d4e5f6a7b8
Revises: a7b8c9d0e1f2
Create Date: 2026-04-25 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "a7b8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Replace FK on categories.restaurant_id
    op.execute("""
    DO $$
    DECLARE fkname TEXT;
    BEGIN
        SELECT c.conname INTO fkname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'categories' AND c.contype = 'f' AND (
            SELECT attname FROM pg_attribute WHERE attrelid = t.oid AND attnum = c.conkey[1]
        ) = 'restaurant_id'
        LIMIT 1;
        IF fkname IS NOT NULL THEN
            EXECUTE format('ALTER TABLE categories DROP CONSTRAINT %I', fkname);
        END IF;
        EXECUTE 'ALTER TABLE categories ADD CONSTRAINT fk_categories_restaurant_id FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE';
    END $$;
    """)

    # Replace FK on dishes.category_id
    op.execute("""
    DO $$
    DECLARE fkname TEXT;
    BEGIN
        SELECT c.conname INTO fkname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'dishes' AND c.contype = 'f' AND (
            SELECT attname FROM pg_attribute WHERE attrelid = t.oid AND attnum = c.conkey[1]
        ) = 'category_id'
        LIMIT 1;
        IF fkname IS NOT NULL THEN
            EXECUTE format('ALTER TABLE dishes DROP CONSTRAINT %I', fkname);
        END IF;
        EXECUTE 'ALTER TABLE dishes ADD CONSTRAINT fk_dishes_category_id FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE';
    END $$;
    """)

    # Replace FK on restaurants.owner_id
    op.execute("""
    DO $$
    DECLARE fkname TEXT;
    BEGIN
        SELECT c.conname INTO fkname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'restaurants' AND c.contype = 'f' AND (
            SELECT attname FROM pg_attribute WHERE attrelid = t.oid AND attnum = c.conkey[1]
        ) = 'owner_id'
        LIMIT 1;
        IF fkname IS NOT NULL THEN
            EXECUTE format('ALTER TABLE restaurants DROP CONSTRAINT %I', fkname);
        END IF;
        EXECUTE 'ALTER TABLE restaurants ADD CONSTRAINT fk_restaurants_owner_id FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE';
    END $$;
    """)


def downgrade() -> None:
    # Recreate FKs without ON DELETE CASCADE
    op.execute("""
    ALTER TABLE categories DROP CONSTRAINT IF EXISTS fk_categories_restaurant_id;
    ALTER TABLE categories ADD CONSTRAINT fk_categories_restaurant_id FOREIGN KEY (restaurant_id) REFERENCES restaurants(id);
    """)

    op.execute("""
    ALTER TABLE dishes DROP CONSTRAINT IF EXISTS fk_dishes_category_id;
    ALTER TABLE dishes ADD CONSTRAINT fk_dishes_category_id FOREIGN KEY (category_id) REFERENCES categories(id);
    """)

    op.execute("""
    ALTER TABLE restaurants DROP CONSTRAINT IF EXISTS fk_restaurants_owner_id;
    ALTER TABLE restaurants ADD CONSTRAINT fk_restaurants_owner_id FOREIGN KEY (owner_id) REFERENCES users(id);
    """)
