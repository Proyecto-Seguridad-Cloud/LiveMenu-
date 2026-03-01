import pytest
from uuid import uuid4

from httpx import AsyncClient, ASGITransport
from fastapi import HTTPException

from app.main import app
from app.services.menu_service import MenuService


@pytest.mark.asyncio
async def test_get_public_menu_200(override_db, monkeypatch):
    MenuService.clear_cache()

    payload = {
        "restaurant": {
            "id": str(uuid4()), "name": "Demo", "slug": "demo",
            "description": None, "logo_url": None, "phone": None,
            "address": None, "hours": None,
        },
        "categories": [],
    }

    async def fake_get_public_menu(db, slug):
        if slug == "demo":
            return payload
        raise HTTPException(status_code=404, detail="Not found")

    monkeypatch.setattr(MenuService, "get_public_menu", staticmethod(fake_get_public_menu))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/menu/demo")

    assert response.status_code == 200
    assert response.json()["restaurant"]["name"] == "Demo"


@pytest.mark.asyncio
async def test_get_public_menu_404(override_db, monkeypatch):
    MenuService.clear_cache()

    async def fake_get_public_menu(db, slug):
        raise HTTPException(status_code=404, detail="Not found")

    monkeypatch.setattr(MenuService, "get_public_menu", staticmethod(fake_get_public_menu))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/menu/nonexistent")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_short_url_200(override_db, monkeypatch):
    MenuService.clear_cache()

    payload = {
        "restaurant": {
            "id": str(uuid4()), "name": "Short", "slug": "short",
            "description": None, "logo_url": None, "phone": None,
            "address": None, "hours": None,
        },
        "categories": [],
    }

    async def fake_get_public_menu(db, slug):
        return payload

    monkeypatch.setattr(MenuService, "get_public_menu", staticmethod(fake_get_public_menu))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/m/short")

    assert response.status_code == 200
    assert response.json()["restaurant"]["slug"] == "short"
