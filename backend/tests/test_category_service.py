from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.services import category_service
from app.services.category_service import CategoryService


@pytest.mark.asyncio
async def test_create_sets_next_position(monkeypatch):
    async def fake_max_position(db, restaurant_id):
        _ = db, restaurant_id
        return 3

    async def fake_create(db, **kwargs):
        _ = db
        return SimpleNamespace(**kwargs)

    monkeypatch.setattr(category_service, "max_position", fake_max_position)
    monkeypatch.setattr(category_service, "create_category", fake_create)

    result = await CategoryService.create(SimpleNamespace(), uuid4(), "Entradas")

    assert result.position == 4
    assert result.name == "Entradas"


@pytest.mark.asyncio
async def test_create_handles_repository_error(monkeypatch):
    async def fake_max_position(db, restaurant_id):
        _ = db, restaurant_id
        return 0

    async def fake_create(db, **kwargs):
        _ = db, kwargs
        raise RuntimeError("db error")

    monkeypatch.setattr(category_service, "max_position", fake_max_position)
    monkeypatch.setattr(category_service, "create_category", fake_create)

    with pytest.raises(HTTPException) as exc:
        await CategoryService.create(SimpleNamespace(), uuid4(), "Entradas")

    assert exc.value.status_code == 500


@pytest.mark.asyncio
async def test_reorder_updates_positions(monkeypatch):
    ids = [str(uuid4()), str(uuid4())]
    cats = {
        ids[0]: SimpleNamespace(position=0),
        ids[1]: SimpleNamespace(position=0),
    }

    async def fake_get_by_id(db, cat_id):
        _ = db
        return cats.get(str(cat_id))

    async def fake_list(db, restaurant_id):
        _ = db, restaurant_id
        return [cats[ids[0]], cats[ids[1]]]

    db = SimpleNamespace(added=[], commit_called=False)

    def add(obj):
        db.added.append(obj)

    async def commit():
        db.commit_called = True

    db.add = add
    db.commit = commit

    monkeypatch.setattr(category_service, "get_category_by_id", fake_get_by_id)
    monkeypatch.setattr(category_service, "list_categories_by_restaurant", fake_list)

    result = await CategoryService.reorder(db, uuid4(), ids)

    assert db.commit_called is True
    assert cats[ids[0]].position == 1
    assert cats[ids[1]].position == 2
    assert len(result) == 2


@pytest.mark.asyncio
async def test_reorder_raises_when_missing_category(monkeypatch):
    async def fake_get_by_id(db, cat_id):
        _ = db, cat_id
        return None

    monkeypatch.setattr(category_service, "get_category_by_id", fake_get_by_id)

    db = SimpleNamespace(add=lambda *_: None, commit=lambda: None)

    with pytest.raises(HTTPException) as exc:
        await CategoryService.reorder(db, uuid4(), [str(uuid4())])

    assert exc.value.status_code == 404
