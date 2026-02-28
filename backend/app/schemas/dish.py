from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator


ALLOWED_DISH_TAGS = {
    "vegetariano",
    "vegano",
    "sin gluten",
    "sin lactosa",
    "picante",
    "nuevo",
    "recomendado",
    "popular",
}


def _normalize_and_validate_tags(tags: list[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()

    for tag in tags:
        value = " ".join(tag.strip().lower().split())
        if not value:
            continue
        if value not in ALLOWED_DISH_TAGS:
            raise ValueError(
                f"Etiqueta no permitida: '{tag}'. Permitidas: {', '.join(sorted(ALLOWED_DISH_TAGS))}"
            )
        if value not in seen:
            seen.add(value)
            normalized.append(value)

    if len(normalized) > 8:
        raise ValueError("Se permiten máximo 8 etiquetas por plato")

    return normalized


class DishCreate(BaseModel):
    category_id: UUID
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=300)
    price: Decimal = Field(..., gt=0)
    price_offer: Optional[Decimal] = Field(None, gt=0)
    image_url: Optional[str] = Field(None, max_length=1024)
    featured: bool = False
    tags: list[str] = Field(default_factory=list)
    position: int = 0

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, value: list[str]) -> list[str]:
        return _normalize_and_validate_tags(value)

    @model_validator(mode="after")
    def validate_offer_price(self):
        if self.price_offer is not None and self.price_offer >= self.price:
            raise ValueError("El precio de oferta debe ser menor que el precio base")
        return self


class DishUpdate(BaseModel):
    category_id: Optional[UUID] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=300)
    price: Optional[Decimal] = Field(None, gt=0)
    price_offer: Optional[Decimal] = Field(None, gt=0)
    image_url: Optional[str] = Field(None, max_length=1024)
    featured: Optional[bool] = None
    tags: Optional[list[str]] = None
    position: Optional[int] = None

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, value: Optional[list[str]]) -> Optional[list[str]]:
        if value is None:
            return None
        return _normalize_and_validate_tags(value)

    @model_validator(mode="after")
    def validate_offer_price(self):
        if self.price is not None and self.price_offer is not None and self.price_offer >= self.price:
            raise ValueError("El precio de oferta debe ser menor que el precio base")
        return self


class DishAvailabilityUpdate(BaseModel):
    available: bool


class DishOut(BaseModel):
    id: UUID
    category_id: UUID
    name: str
    description: Optional[str]
    price: Decimal
    price_offer: Optional[Decimal]
    image_url: Optional[str]
    available: bool
    featured: bool
    tags: list[str]
    position: int

    model_config = ConfigDict(from_attributes=True)
