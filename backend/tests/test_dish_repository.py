from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.repositories.dish_repository import create_dish, update_dish, soft_delete_dish


class FakeDB:
    def __init__(self):
        self.added = []
        self.commits = 0
        self.refreshed = []

    async def execute(self, query):
        _ = query
        return SimpleNamespace(scalars=lambda: SimpleNamespace(all=lambda: []), scalar_one_or_none=lambda: None)

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        self.commits += 1

    async def refresh(self, obj):
        self.refreshed.append(obj)


@pytest.mark.asyncio
async def test_create_dish_persists_entity():
    db = FakeDB()
    dish = await create_dish(
        db,
        category_id=uuid4(),
        name="Ají",
        price=Decimal("12.00"),
        tags=["popular"],
    )

    assert dish.name == "Ají"
    assert db.commits == 1
    assert len(db.refreshed) == 1


@pytest.mark.asyncio
async def test_update_dish_updates_fields_and_commits():
    db = FakeDB()
    dish = SimpleNamespace(name="Old", available=True)

    updated = await update_dish(db, dish, {"name": "New", "available": False})

    assert updated.name == "New"
    assert updated.available is False
    assert db.commits == 1


@pytest.mark.asyncio
async def test_soft_delete_sets_deleted_at():
    db = FakeDB()
    dish = SimpleNamespace(deleted_at=None)

    await soft_delete_dish(db, dish)

    assert dish.deleted_at is not None
    assert db.commits == 1
