from uuid import UUID
from pydantic import BaseModel, Field, HttpUrl, ConfigDict
from typing import Optional


class RestaurantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[HttpUrl] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    hours: Optional[dict] = None


class RestaurantUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[HttpUrl] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    hours: Optional[dict] = None


class RestaurantOut(BaseModel):
    id: UUID
    owner_id: UUID
    name: str
    slug: str
    description: Optional[str]
    logo_url: Optional[HttpUrl]
    phone: Optional[str]
    address: Optional[str]
    hours: Optional[dict]

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "b3f9a8c2-1e2b-4f3a-9c8d-1234567890ab",
                "owner_id": "d4c3b2a1-9f8e-7d6c-5b4a-321098765432",
                "name": "La Buena Mesa",
                "slug": "la-buena-mesa",
                "description": "Restaurante de comida local y tapas",
                "logo_url": "https://cdn.example.com/logos/123.png",
                "phone": "+56912345678",
                "address": "Av. Principal 123, Ciudad",
                "hours": {"mon-fri": "10:00-22:00", "sat-sun": "11:00-23:00"}
            }
        },
    )
