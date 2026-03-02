from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.handlers import category_handler, dish_handler, menu_handler, qr_handler, restaurant_handler, upload_handler
from app.schemas.category import CategoryCreate, CategoryUpdate, ReorderRequest
from app.schemas.dish import DishAvailabilityUpdate, DishCreate, DishUpdate
from app.schemas.restaurant import RestaurantCreate, RestaurantUpdate


@pytest.mark.asyncio
async def test_restaurant_handler_get_not_found(monkeypatch):
    async def fake_get_by_owner(db, owner_id):
        _ = db, owner_id
        return None

    monkeypatch.setattr(restaurant_handler.RestaurantService, "get_by_owner", fake_get_by_owner)

    with pytest.raises(HTTPException) as exc:
        await restaurant_handler.get_restaurant(SimpleNamespace(), SimpleNamespace(id=uuid4()))

    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_restaurant_handler_create_update_delete(monkeypatch):
    owner_id = uuid4()
    restaurant = SimpleNamespace(id=uuid4(), owner_id=owner_id, name="Demo", slug="demo")

    async def fake_create(db, **kwargs):
        _ = db, kwargs
        return restaurant

    async def fake_get_by_owner(db, incoming_owner_id):
        _ = db
        assert incoming_owner_id == owner_id
        return restaurant

    async def fake_update(db, current_restaurant, data):
        _ = db
        assert current_restaurant is restaurant
        assert "name" in data
        return restaurant

    async def fake_delete(db, current_restaurant):
        _ = db
        assert current_restaurant is restaurant

    monkeypatch.setattr(restaurant_handler.RestaurantService, "create", fake_create)
    monkeypatch.setattr(restaurant_handler.RestaurantService, "get_by_owner", fake_get_by_owner)
    monkeypatch.setattr(restaurant_handler.RestaurantService, "update", fake_update)
    monkeypatch.setattr(restaurant_handler.RestaurantService, "delete", fake_delete)

    payload_create = RestaurantCreate(name="Demo", description="desc")
    payload_update = RestaurantUpdate(name="Nuevo")

    created = await restaurant_handler.create_restaurant(payload_create, SimpleNamespace(), SimpleNamespace(id=owner_id))
    updated = await restaurant_handler.update_restaurant(payload_update, SimpleNamespace(), SimpleNamespace(id=owner_id))
    deleted = await restaurant_handler.delete_restaurant(SimpleNamespace(), SimpleNamespace(id=owner_id))

    assert created is restaurant
    assert updated is restaurant
    assert deleted is None


@pytest.mark.asyncio
async def test_category_handler_list_and_reorder(monkeypatch):
    owner_id = uuid4()
    restaurant = SimpleNamespace(id=uuid4())
    category = SimpleNamespace(id=uuid4(), name="Entradas")

    async def fake_get_by_owner(db, incoming_owner_id):
        _ = db
        assert incoming_owner_id == owner_id
        return restaurant

    async def fake_list(db, restaurant_id):
        _ = db
        assert restaurant_id == restaurant.id
        return [category]

    async def fake_reorder(db, restaurant_id, ids):
        _ = db
        assert restaurant_id == restaurant.id
        assert len(ids) == 1
        return [category]

    monkeypatch.setattr(category_handler.RestaurantService, "get_by_owner", fake_get_by_owner)
    monkeypatch.setattr(category_handler.CategoryService, "list", fake_list)
    monkeypatch.setattr(category_handler.CategoryService, "reorder", fake_reorder)

    listed = await category_handler.list_categories(SimpleNamespace(), SimpleNamespace(id=owner_id))
    reordered = await category_handler.reorder(ReorderRequest(ids=[str(category.id)]), SimpleNamespace(), SimpleNamespace(id=owner_id))

    assert listed == [category]
    assert reordered == [category]


@pytest.mark.asyncio
async def test_category_handler_create_update_delete(monkeypatch):
    owner_id = uuid4()
    restaurant = SimpleNamespace(id=uuid4())
    category = SimpleNamespace(id=uuid4(), name="Entradas")

    async def fake_get_by_owner(db, incoming_owner_id):
        _ = db
        assert incoming_owner_id == owner_id
        return restaurant

    async def fake_create(db, restaurant_id, **kwargs):
        _ = db, kwargs
        assert restaurant_id == restaurant.id
        return category

    async def fake_get_owned(db, restaurant_id, category_id):
        _ = db
        assert restaurant_id == restaurant.id
        assert category_id == category.id
        return category

    async def fake_update(db, current_category, data):
        _ = db
        assert current_category is category
        assert "name" in data
        return category

    async def fake_delete(db, current_category):
        _ = db
        assert current_category is category

    monkeypatch.setattr(category_handler.RestaurantService, "get_by_owner", fake_get_by_owner)
    monkeypatch.setattr(category_handler.CategoryService, "create", fake_create)
    monkeypatch.setattr(category_handler.CategoryService, "get_owned", fake_get_owned)
    monkeypatch.setattr(category_handler.CategoryService, "update", fake_update)
    monkeypatch.setattr(category_handler.CategoryService, "delete", fake_delete)

    created = await category_handler.create_category(
        CategoryCreate(name="Entradas", description="desc"),
        SimpleNamespace(),
        SimpleNamespace(id=owner_id),
    )
    updated = await category_handler.update_category(
        category_id=str(category.id),
        payload=CategoryUpdate(name="Nuevas"),
        db=SimpleNamespace(),
        current_user=SimpleNamespace(id=owner_id),
    )
    deleted = await category_handler.delete_category(
        category_id=str(category.id),
        db=SimpleNamespace(),
        current_user=SimpleNamespace(id=owner_id),
    )

    assert created is category
    assert updated is category
    assert deleted is None


@pytest.mark.asyncio
async def test_dish_handler_paths(monkeypatch):
    owner_id = uuid4()
    restaurant = SimpleNamespace(id=uuid4())
    dish = SimpleNamespace(id=uuid4(), name="Pasta")

    async def fake_get_by_owner(db, incoming_owner_id):
        _ = db
        assert incoming_owner_id == owner_id
        return restaurant

    async def fake_list(db, restaurant_id, category_id=None, available=None):
        _ = db
        assert restaurant_id == restaurant.id
        return [dish]

    async def fake_get(db, dish_id, restaurant_id):
        _ = db
        assert dish_id == dish.id
        assert restaurant_id == restaurant.id
        return dish

    async def fake_create(db, restaurant_id, payload):
        _ = db
        assert restaurant_id == restaurant.id
        assert payload["name"] == "Pasta"
        return dish

    async def fake_update(db, current_dish, restaurant_id, payload):
        _ = db
        assert current_dish is dish
        assert restaurant_id == restaurant.id
        assert "name" in payload
        return dish

    async def fake_delete(db, current_dish):
        _ = db
        assert current_dish is dish

    async def fake_update_availability(db, current_dish, available):
        _ = db
        assert current_dish is dish
        assert available is True
        return dish

    monkeypatch.setattr(dish_handler.RestaurantService, "get_by_owner", fake_get_by_owner)
    monkeypatch.setattr(dish_handler.DishService, "list", fake_list)
    monkeypatch.setattr(dish_handler.DishService, "get", fake_get)
    monkeypatch.setattr(dish_handler.DishService, "create", fake_create)
    monkeypatch.setattr(dish_handler.DishService, "update", fake_update)
    monkeypatch.setattr(dish_handler.DishService, "delete", fake_delete)
    monkeypatch.setattr(dish_handler.DishService, "update_availability", fake_update_availability)

    payload_create = DishCreate(category_id=uuid4(), name="Pasta", price="10")
    payload_update = DishUpdate(name="Pasta 2")

    listed = await dish_handler.list_dishes(None, None, SimpleNamespace(), SimpleNamespace(id=owner_id))
    fetched = await dish_handler.get_dish(dish.id, SimpleNamespace(), SimpleNamespace(id=owner_id))
    created = await dish_handler.create_dish(payload_create, SimpleNamespace(), SimpleNamespace(id=owner_id))
    updated = await dish_handler.update_dish(dish.id, payload_update, SimpleNamespace(), SimpleNamespace(id=owner_id))
    deleted = await dish_handler.delete_dish(dish.id, SimpleNamespace(), SimpleNamespace(id=owner_id))
    toggled = await dish_handler.update_availability(
        dish.id,
        DishAvailabilityUpdate(available=True),
        SimpleNamespace(),
        SimpleNamespace(id=owner_id),
    )

    assert listed == [dish]
    assert fetched is dish
    assert created is dish
    assert updated is dish
    assert deleted is None
    assert toggled is dish


@pytest.mark.asyncio
async def test_menu_handler_routes(monkeypatch):
    response = {"restaurant": {"slug": "demo"}, "categories": []}

    async def fake_get_public_menu(db, slug):
        _ = db
        assert slug == "demo"
        return response

    monkeypatch.setattr(menu_handler.MenuService, "get_public_menu", fake_get_public_menu)

    direct = await menu_handler.get_public_menu("demo", SimpleNamespace())
    short = await menu_handler.get_public_menu_short("demo", SimpleNamespace())

    assert direct == response
    assert short == response


@pytest.mark.asyncio
async def test_qr_handler_success_and_not_found(monkeypatch):
    owner_id = uuid4()
    restaurant = SimpleNamespace(slug="demo")

    async def fake_get_by_owner(db, incoming_owner_id):
        _ = db
        assert incoming_owner_id == owner_id
        return restaurant

    monkeypatch.setattr(qr_handler.RestaurantService, "get_by_owner", fake_get_by_owner)
    monkeypatch.setattr(qr_handler.QrService, "build_menu_url", lambda slug: f"http://menu/{slug}")
    monkeypatch.setattr(qr_handler.QrService, "generate_qr", lambda url, output_format, size: (b"bytes", "image/png"))

    resp = await qr_handler.get_qr("png", "md", SimpleNamespace(), SimpleNamespace(id=owner_id))
    assert resp.media_type == "image/png"

    async def fake_none(db, incoming_owner_id):
        _ = db, incoming_owner_id
        return None

    monkeypatch.setattr(qr_handler.RestaurantService, "get_by_owner", fake_none)
    with pytest.raises(HTTPException) as exc:
        await qr_handler.get_qr("png", "md", SimpleNamespace(), SimpleNamespace(id=owner_id))
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_upload_handler_paths(monkeypatch):
    owner_id = uuid4()

    async def fake_upload_image(file, user_id):
        _ = file
        assert user_id == str(owner_id)
        return {"file_id": "x", "original_filename": "img", "urls": {"thumbnail": "u"}}

    async def fake_list_images(db, user_id):
        _ = db
        assert user_id == str(owner_id)
        return [{"file_id": "x", "original_filename": "img", "urls": {"thumbnail": "u"}}]

    monkeypatch.setattr(upload_handler.UploadService, "upload_image", fake_upload_image)
    monkeypatch.setattr(upload_handler.UploadService, "list_images", fake_list_images)
    monkeypatch.setattr(upload_handler.UploadService, "delete_image", lambda filename: {"file_id": filename, "deleted_files": 1})

    uploaded = await upload_handler.upload_image(SimpleNamespace(), SimpleNamespace(id=owner_id))
    listed = await upload_handler.list_images(SimpleNamespace(), SimpleNamespace(id=owner_id))
    deleted = await upload_handler.delete_image("file-id", SimpleNamespace(id=owner_id))

    assert uploaded["file_id"] == "x"
    assert listed[0]["file_id"] == "x"
    assert deleted["deleted_files"] == 1