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

    model_config = ConfigDict(from_attributes=True)
