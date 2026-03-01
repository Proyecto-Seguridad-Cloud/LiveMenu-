import pytest
from types import SimpleNamespace
from uuid import uuid4

from httpx import AsyncClient, ASGITransport

from app.main import app
from app.services.restaurant_service import RestaurantService


@pytest.mark.asyncio
async def test_get_restaurant_200(override_auth, monkeypatch):
    _, fake_user = override_auth
    rid = uuid4()

    async def fake_get_by_owner(db, owner_id):
        return SimpleNamespace(
            id=rid, owner_id=owner_id, name="My Restaurant", slug="my-restaurant",
            description="Desc", logo_url=None, phone="123", address="Addr", hours=None,
        )

    monkeypatch.setattr(RestaurantService, "get_by_owner", staticmethod(fake_get_by_owner))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/admin/restaurant")

    assert response.status_code == 200
    assert response.json()["name"] == "My Restaurant"


@pytest.mark.asyncio
async def test_get_restaurant_404(override_auth, monkeypatch):
    async def fake_get_by_owner(db, owner_id):
        return None

    monkeypatch.setattr(RestaurantService, "get_by_owner", staticmethod(fake_get_by_owner))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/admin/restaurant")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_restaurant_201(override_auth, monkeypatch):
    _, fake_user = override_auth

    async def fake_create(db, owner_id, name, **kwargs):
        return SimpleNamespace(
            id=uuid4(), owner_id=owner_id, name=name, slug="test-rest",
            description=kwargs.get("description"), logo_url=kwargs.get("logo_url"),
            phone=kwargs.get("phone"), address=kwargs.get("address"), hours=kwargs.get("hours"),
        )

    monkeypatch.setattr(RestaurantService, "create", staticmethod(fake_create))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/admin/restaurant", json={"name": "Test Rest"})

    assert response.status_code == 201
    assert response.json()["name"] == "Test Rest"


@pytest.mark.asyncio
async def test_update_restaurant_200(override_auth, monkeypatch):
    _, fake_user = override_auth
    rid = uuid4()

    async def fake_get_by_owner(db, owner_id):
        return SimpleNamespace(
            id=rid, owner_id=owner_id, name="Old", slug="old",
            description=None, logo_url=None, phone=None, address=None, hours=None,
        )

    async def fake_update(db, restaurant, data):
        for key, value in data.items():
            setattr(restaurant, key, value)
        return restaurant

    monkeypatch.setattr(RestaurantService, "get_by_owner", staticmethod(fake_get_by_owner))
    monkeypatch.setattr(RestaurantService, "update", staticmethod(fake_update))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.put("/api/v1/admin/restaurant", json={"name": "New Name"})

    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


@pytest.mark.asyncio
async def test_delete_restaurant_204(override_auth, monkeypatch):
    async def fake_get_by_owner(db, owner_id):
        return SimpleNamespace(id=uuid4())

    async def fake_delete(db, restaurant):
        pass

    monkeypatch.setattr(RestaurantService, "get_by_owner", staticmethod(fake_get_by_owner))
    monkeypatch.setattr(RestaurantService, "delete", staticmethod(fake_delete))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.delete("/api/v1/admin/restaurant")

    assert response.status_code == 204
