from types import SimpleNamespace

import pytest

from app.repositories.user_repository import create_user


class FakeDB:
    def __init__(self):
        self.added = []
        self.commits = 0
        self.refreshed = []

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        self.commits += 1

    async def refresh(self, obj):
        self.refreshed.append(obj)


@pytest.mark.asyncio
async def test_create_user_persists_entity():
    db = FakeDB()

    user = await create_user(
        db,
        email="persona1@livemenu.dev",
        full_name="Persona 1",
        password_hash="hashed",
    )

    assert user.email == "persona1@livemenu.dev"
    assert user.full_name == "Persona 1"
    assert db.commits == 1
    assert len(db.refreshed) == 1
