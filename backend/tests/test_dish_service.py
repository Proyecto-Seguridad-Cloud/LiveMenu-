from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.services import dish_service
from app.services.dish_service import DishService


class FakeResult:
    def __init__(self, scalar=None, rows=None):
        self._scalar = scalar
        self._rows = rows or []

    def scalar_one_or_none(self):
        return self._scalar

    def all(self):
        return self._rows


class QueueDB:
    def __init__(self, results):
        self.results = list(results)

    async def execute(self, query):
        _ = query
        if not self.results:
            return FakeResult()
        return self.results.pop(0)


@pytest.mark.asyncio
async def test_create_raises_when_category_not_found(monkeypatch):
    async def fake_get_owner_category(db, category_id, restaurant_id):
        _ = db, category_id, restaurant_id
        return None

    monkeypatch.setattr(DishService, "_get_owner_category", fake_get_owner_category)

    with pytest.raises(HTTPException) as exc:
        await DishService.create(QueueDB([]), uuid4(), {"category_id": uuid4(), "price": Decimal("10.00")})

    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_create_success(monkeypatch):
    category = SimpleNamespace(id=uuid4())

    async def fake_get_owner_category(db, category_id, restaurant_id):
        _ = db, category_id, restaurant_id
        return category

    async def fake_create_dish(db, **kwargs):
        _ = db
        return SimpleNamespace(id=uuid4(), **kwargs)

    monkeypatch.setattr(DishService, "_get_owner_category", fake_get_owner_category)
    monkeypatch.setattr(dish_service, "create_dish", fake_create_dish)

    payload = {"category_id": uuid4(), "name": "Lomo", "price": Decimal("20.00"), "price_offer": Decimal("15.00")}
    result = await DishService.create(QueueDB([]), uuid4(), payload)

    assert result.name == "Lomo"
    assert result.price_offer == Decimal("15.00")


@pytest.mark.asyncio
async def test_get_not_found(monkeypatch):
    async def fake_get_dish_by_id(db, dish_id):
        _ = db, dish_id
        return None

    monkeypatch.setattr(dish_service, "get_dish_by_id", fake_get_dish_by_id)

    with pytest.raises(HTTPException) as exc:
        await DishService.get(QueueDB([]), uuid4(), uuid4())

    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_update_availability_calls_repository(monkeypatch):
    dish = SimpleNamespace(id=uuid4(), available=True)

    async def fake_update_dish(db, dish_obj, data):
        _ = db
        dish_obj.available = data["available"]
        return dish_obj

    monkeypatch.setattr(dish_service, "update_dish", fake_update_dish)

    result = await DishService.update_availability(QueueDB([]), dish, False)
    assert result.available is False


@pytest.mark.asyncio
async def test_list_without_categories_returns_empty():
    db = QueueDB([FakeResult(rows=[])])
    result = await DishService.list(db, uuid4(), category_id=None, available=None)
    assert result == []
