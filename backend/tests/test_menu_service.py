from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.services import menu_service
from app.services.menu_service import MenuService


@pytest.mark.asyncio
async def test_get_public_menu_builds_grouped_payload(monkeypatch):
    MenuService.clear_cache()
    slug = "rest-demo"
    restaurant_id = uuid4()
    category_id = uuid4()

    restaurant = SimpleNamespace(
        id=restaurant_id,
        name="Demo",
        slug=slug,
        description="desc",
        logo_url=None,
        phone=None,
        address=None,
        hours=None,
    )
    categories = [SimpleNamespace(id=category_id, name="Entradas", description=None, position=1, active=True)]
    dishes = [
        SimpleNamespace(
            id=uuid4(),
            category_id=category_id,
            name="Nachos",
            description="x",
            price=Decimal("10.00"),
            price_offer=Decimal("8.00"),
            image_url=None,
            featured=False,
            tags=["popular"],
        )
    ]

    async def fake_get_restaurant_by_slug(db, incoming_slug):
        _ = db
        if incoming_slug == slug:
            return restaurant
        return None

    async def fake_list_categories(db, incoming_restaurant_id):
        _ = db, incoming_restaurant_id
        return categories

    async def fake_list_dishes(db, category_ids=None, available=None):
        _ = db, category_ids, available
        return dishes

    monkeypatch.setattr(menu_service, "get_restaurant_by_slug", fake_get_restaurant_by_slug)
    monkeypatch.setattr(menu_service, "list_categories_by_restaurant", fake_list_categories)
    monkeypatch.setattr(menu_service, "list_dishes", fake_list_dishes)

    result = await MenuService.get_public_menu(SimpleNamespace(), slug)

    assert result["restaurant"]["slug"] == slug
    assert len(result["categories"]) == 1
    assert len(result["categories"][0]["dishes"]) == 1


@pytest.mark.asyncio
async def test_get_public_menu_uses_cache(monkeypatch):
    MenuService.clear_cache()
    slug = "cached-rest"

    calls = {"restaurant": 0}
    restaurant = SimpleNamespace(
        id=uuid4(),
        name="Cache",
        slug=slug,
        description=None,
        logo_url=None,
        phone=None,
        address=None,
        hours=None,
    )

    async def fake_get_restaurant_by_slug(db, incoming_slug):
        _ = db, incoming_slug
        calls["restaurant"] += 1
        return restaurant

    async def fake_list_categories(db, incoming_restaurant_id):
        _ = db, incoming_restaurant_id
        return []

    async def fake_list_dishes(db, category_ids=None, available=None):
        _ = db, category_ids, available
        return []

    monkeypatch.setattr(menu_service, "get_restaurant_by_slug", fake_get_restaurant_by_slug)
    monkeypatch.setattr(menu_service, "list_categories_by_restaurant", fake_list_categories)
    monkeypatch.setattr(menu_service, "list_dishes", fake_list_dishes)

    first = await MenuService.get_public_menu(SimpleNamespace(), slug)
    second = await MenuService.get_public_menu(SimpleNamespace(), slug)

    assert first == second
    assert calls["restaurant"] == 1


@pytest.mark.asyncio
async def test_get_public_menu_raises_when_slug_missing(monkeypatch):
    MenuService.clear_cache()

    async def fake_get_restaurant_by_slug(db, incoming_slug):
        _ = db, incoming_slug
        return None

    monkeypatch.setattr(menu_service, "get_restaurant_by_slug", fake_get_restaurant_by_slug)

    with pytest.raises(HTTPException) as exc:
        await MenuService.get_public_menu(SimpleNamespace(), "nope")

    assert exc.value.status_code == 404
