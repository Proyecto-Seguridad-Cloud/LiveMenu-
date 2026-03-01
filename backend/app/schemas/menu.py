from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class PublicMenuDish(BaseModel):
    id: UUID
    name: str
    description: str | None
    price: Decimal
    price_offer: Decimal | None
    image_url: str | None
    featured: bool
    tags: list[str]

    model_config = ConfigDict(from_attributes=True)


class PublicMenuCategory(BaseModel):
    id: UUID
    name: str
    description: str | None
    position: int
    dishes: list[PublicMenuDish]


class PublicMenuRestaurant(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str | None
    logo_url: str | None
    phone: str | None
    address: str | None
    hours: dict | None


class PublicMenuResponse(BaseModel):
    restaurant: PublicMenuRestaurant
    categories: list[PublicMenuCategory]
