from types import SimpleNamespace

import pytest

from app.repositories.restaurant_repository import create_restaurant, update_restaurant, delete_restaurant


class FakeDB:
    def __init__(self):
        self.added = []
        self.commits = 0
        self.refreshed = []
        self.deleted = []

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        self.commits += 1

    async def refresh(self, obj):
        self.refreshed.append(obj)

    async def delete(self, obj):
        self.deleted.append(obj)


@pytest.mark.asyncio
async def test_create_restaurant_persists_entity():
    db = FakeDB()
    restaurant = await create_restaurant(db, owner_id="owner", name="Rest", slug="rest")

    assert restaurant.name == "Rest"
    assert restaurant.slug == "rest"
    assert db.commits == 1


@pytest.mark.asyncio
async def test_update_restaurant_changes_data():
    db = FakeDB()
    restaurant = SimpleNamespace(name="Old", description=None)

    updated = await update_restaurant(db, restaurant, {"name": "New", "description": "Demo"})

    assert updated.name == "New"
    assert updated.description == "Demo"
    assert db.commits == 1


@pytest.mark.asyncio
async def test_delete_restaurant_commits():
    db = FakeDB()
    restaurant = SimpleNamespace(id="r1")

    await delete_restaurant(db, restaurant)

    assert db.deleted == [restaurant]
    assert db.commits == 1
