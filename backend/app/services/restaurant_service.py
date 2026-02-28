import uuid
import re
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.restaurant_repository import (
    get_restaurant_by_owner,
    get_restaurant_by_slug,
    create_restaurant,
    update_restaurant,
    delete_restaurant,
)


def _slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:110]


class RestaurantService:

    @staticmethod
    async def get_by_owner(db: AsyncSession, owner_id: uuid.UUID):
        return await get_restaurant_by_owner(db, owner_id)

    @staticmethod
    async def create(db: AsyncSession, owner_id: uuid.UUID, name: str, **kwargs):
        existing_owner_restaurant = await get_restaurant_by_owner(db, owner_id)
        if existing_owner_restaurant:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El usuario ya tiene un restaurante")

        base = _slugify(name)
        slug = base
        existing = await get_restaurant_by_slug(db, slug)
        if existing:
            slug = f"{base}-{uuid.uuid4().hex[:6]}"

        payload = {"owner_id": owner_id, "name": name, "slug": slug}
        payload.update(kwargs)
        try:
            return await create_restaurant(db, **payload)
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

    @staticmethod
    async def update(db: AsyncSession, restaurant, data: dict):
        if "name" in data and data.get("name"):
            # keep slug unchanged for now; could update if desired
            pass
        return await update_restaurant(db, restaurant, data)

    @staticmethod
    async def delete(db: AsyncSession, restaurant):
        return await delete_restaurant(db, restaurant)
