from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.auth import LoginRequest, LogoutResponse, RegisterRequest, TokenResponse
from app.schemas.category import CategoryCreate, CategoryOut, CategoryUpdate, ReorderRequest
from app.schemas.dish import ALLOWED_DISH_TAGS, DishAvailabilityUpdate, DishCreate, DishOut, DishUpdate
from app.schemas.menu import PublicMenuCategory, PublicMenuDish, PublicMenuResponse, PublicMenuRestaurant
from app.schemas.restaurant import RestaurantCreate, RestaurantOut, RestaurantUpdate
from app.schemas.upload import DeleteUploadResponse, UploadImageResponse


def test_auth_schemas():
    register = RegisterRequest(email="demo@test.com", full_name="Demo User", password="Password123")
    login = LoginRequest(email="demo@test.com", password="Password123")
    token = TokenResponse(access_token="abc")
    logout = LogoutResponse(message="ok")

    assert register.email == "demo@test.com"
    assert login.password == "Password123"
    assert token.token_type == "bearer"
    assert logout.message == "ok"


def test_category_schemas():
    category_id = uuid4()
    restaurant_id = uuid4()

    create = CategoryCreate(name="Entradas", description="desc")
    update = CategoryUpdate(name="Nuevas", active=True)
    reorder = ReorderRequest(ids=[str(category_id)])
    out = CategoryOut.model_validate(
        SimpleNamespace(
            id=category_id,
            restaurant_id=restaurant_id,
            name="Entradas",
            description="desc",
            position=1,
            active=True,
        )
    )

    assert create.name == "Entradas"
    assert update.active is True
    assert reorder.ids == [str(category_id)]
    assert out.restaurant_id == restaurant_id


def test_dish_create_validates_tags_and_offer():
    payload = DishCreate(
        category_id=uuid4(),
        name="Pasta",
        price=Decimal("20"),
        price_offer=Decimal("15"),
        tags=[" NUEVO ", "recomendado", "nuevo"],
    )

    assert payload.tags == ["nuevo", "recomendado"]


def test_dish_create_rejects_invalid_tag():
    with pytest.raises(ValidationError):
        DishCreate(category_id=uuid4(), name="Pasta", price=Decimal("20"), tags=["invalid-tag"])


def test_dish_create_rejects_offer_not_lower():
    with pytest.raises(ValidationError):
        DishCreate(category_id=uuid4(), name="Pasta", price=Decimal("20"), price_offer=Decimal("20"), tags=[])


def test_dish_update_validations():
    update = DishUpdate(name="Pasta 2", price=Decimal("25"), price_offer=Decimal("10"), tags=["sin gluten"])
    availability = DishAvailabilityUpdate(available=True)

    assert update.tags == ["sin gluten"]
    assert availability.available is True


def test_dish_update_rejects_invalid_tags_and_offer():
    with pytest.raises(ValidationError):
        DishUpdate(tags=["nope"])

    with pytest.raises(ValidationError):
        DishUpdate(price=Decimal("10"), price_offer=Decimal("12"))


def test_dish_out_from_attributes():
    item = DishOut.model_validate(
        SimpleNamespace(
            id=uuid4(),
            category_id=uuid4(),
            name="Pasta",
            description="desc",
            price=Decimal("10.00"),
            price_offer=None,
            image_url=None,
            available=True,
            featured=False,
            tags=["nuevo"],
            position=0,
        )
    )

    assert item.name == "Pasta"


def test_restaurant_schemas():
    create = RestaurantCreate(name="Demo", description="desc", logo_url="https://example.com/logo.png")
    update = RestaurantUpdate(name="Demo 2")
    out = RestaurantOut.model_validate(
        SimpleNamespace(
            id=uuid4(),
            owner_id=uuid4(),
            name="Demo",
            slug="demo",
            description="desc",
            logo_url="https://example.com/logo.png",
            phone=None,
            address=None,
            hours=None,
        )
    )

    assert create.name == "Demo"
    assert update.name == "Demo 2"
    assert out.slug == "demo"


def test_menu_and_upload_schemas():
    restaurant = PublicMenuRestaurant(
        id=uuid4(),
        name="Demo",
        slug="demo",
        description=None,
        logo_url=None,
        phone=None,
        address=None,
        hours=None,
    )
    dish = PublicMenuDish(
        id=uuid4(),
        name="Pasta",
        description=None,
        price=Decimal("12.5"),
        price_offer=None,
        image_url=None,
        featured=False,
        tags=["popular"],
    )
    category = PublicMenuCategory(id=uuid4(), name="Platos", description=None, position=1, dishes=[dish])
    response = PublicMenuResponse(restaurant=restaurant, categories=[category])

    upload = UploadImageResponse(file_id="abc", original_filename="foto", urls={"thumbnail": "url"})
    delete = DeleteUploadResponse(file_id="abc", deleted_files=3)

    assert response.categories[0].dishes[0].name == "Pasta"
    assert upload.file_id == "abc"
    assert delete.deleted_files == 3


def test_allowed_tags_not_empty():
    assert "nuevo" in ALLOWED_DISH_TAGS
    assert len(ALLOWED_DISH_TAGS) > 0