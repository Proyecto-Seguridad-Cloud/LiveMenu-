from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.services import restaurant_service
from app.services.restaurant_service import RestaurantService


@pytest.mark.asyncio
async def test_create_rejects_if_owner_already_has_restaurant(monkeypatch):
    async def fake_get_by_owner(db, owner_id):
        _ = db, owner_id
        return SimpleNamespace(id=uuid4())

    monkeypatch.setattr(restaurant_service, "get_restaurant_by_owner", fake_get_by_owner)

    with pytest.raises(HTTPException) as exc:
        await RestaurantService.create(SimpleNamespace(), uuid4(), "Mi Rest")

    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_create_appends_random_suffix_when_slug_exists(monkeypatch):
    async def fake_get_by_owner(db, owner_id):
        _ = db, owner_id
        return None

    calls = {"count": 0}

    async def fake_get_by_slug(db, slug):
        _ = db
        calls["count"] += 1
        if calls["count"] == 1:
            return SimpleNamespace(id=uuid4())
        return None

    async def fake_create(db, **kwargs):
        _ = db
        return SimpleNamespace(**kwargs)

    monkeypatch.setattr(restaurant_service, "get_restaurant_by_owner", fake_get_by_owner)
    monkeypatch.setattr(restaurant_service, "get_restaurant_by_slug", fake_get_by_slug)
    monkeypatch.setattr(restaurant_service, "create_restaurant", fake_create)

    result = await RestaurantService.create(SimpleNamespace(), uuid4(), "Mi Rest")

    assert result.slug.startswith("mi-rest")
    assert result.slug != "mi-rest"


@pytest.mark.asyncio
async def test_update_delegates_to_repository(monkeypatch):
    restaurant = SimpleNamespace(name="Old")

    async def fake_update(db, rest, data):
        _ = db
        for key, value in data.items():
            setattr(rest, key, value)
        return rest

    monkeypatch.setattr(restaurant_service, "update_restaurant", fake_update)
    updated = await RestaurantService.update(SimpleNamespace(), restaurant, {"name": "New"})

    assert updated.name == "New"


@pytest.mark.asyncio
async def test_delete_delegates(monkeypatch):
    marker = {"called": False}

    async def fake_delete(db, restaurant):
        _ = db, restaurant
        marker["called"] = True

    monkeypatch.setattr(restaurant_service, "delete_restaurant", fake_delete)

    await RestaurantService.delete(SimpleNamespace(), SimpleNamespace())
    assert marker["called"] is True
