from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    active: Optional[bool] = None


class CategoryOut(BaseModel):
    id: UUID
    restaurant_id: UUID
    name: str
    description: Optional[str]
    position: int
    active: bool

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "a1b2c3d4-1111-2222-3333-444455556666",
                "restaurant_id": "b3f9a8c2-1e2b-4f3a-9c8d-1234567890ab",
                "name": "Entradas",
                "description": "Platos para compartir",
                "position": 1,
                "active": True
            }
        },
    )


class ReorderRequest(BaseModel):
    ids: List[str]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {"ids": [
                "a1b2c3d4-1111-2222-3333-444455556666",
                "d6e5f4a3-7777-8888-9999-000011112222"
            ]}
        }
    )
