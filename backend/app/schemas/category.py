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

    model_config = ConfigDict(from_attributes=True)


class ReorderRequest(BaseModel):
    ids: List[str]
