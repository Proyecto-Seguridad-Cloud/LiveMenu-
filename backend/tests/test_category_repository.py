from types import SimpleNamespace

import pytest

from app.repositories.category_repository import create_category, update_category, delete_category, max_position


class FakeResult:
    def __init__(self, value=None):
        self._value = value

    def scalar_one_or_none(self):
        return self._value


class FakeDB:
    def __init__(self, max_pos=None):
        self.added = []
        self.commits = 0
        self.refreshed = []
        self.deleted = []
        self.max_pos = max_pos

    async def execute(self, query):
        _ = query
        return FakeResult(self.max_pos)

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        self.commits += 1

    async def refresh(self, obj):
        self.refreshed.append(obj)

    async def delete(self, obj):
        self.deleted.append(obj)


@pytest.mark.asyncio
async def test_create_category_persists_entity():
    db = FakeDB()
    category = await create_category(db, name="Entradas", restaurant_id="rid", position=1)

    assert category.name == "Entradas"
    assert db.commits == 1


@pytest.mark.asyncio
async def test_update_category_changes_fields():
    db = FakeDB()
    category = SimpleNamespace(name="Old", active=True)

    updated = await update_category(db, category, {"name": "New", "active": False})

    assert updated.name == "New"
    assert updated.active is False
    assert db.commits == 1


@pytest.mark.asyncio
async def test_delete_category_commits():
    db = FakeDB()
    category = SimpleNamespace(id="c1")

    await delete_category(db, category)

    assert db.deleted == [category]
    assert db.commits == 1


@pytest.mark.asyncio
async def test_max_position_defaults_to_zero_when_none():
    db = FakeDB(max_pos=None)
    position = await max_position(db, "rid")

    assert position == 0


@pytest.mark.asyncio
async def test_max_position_returns_int():
    db = FakeDB(max_pos=7)
    position = await max_position(db, "rid")

    assert position == 7
