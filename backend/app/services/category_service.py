import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.category_repository import (
    list_categories_by_restaurant,
    get_category_by_id,
    create_category,
    update_category,
    delete_category,
    max_position,
)


class CategoryService:

    @staticmethod
    async def list(db: AsyncSession, restaurant_id: uuid.UUID):
        return await list_categories_by_restaurant(db, restaurant_id)

    @staticmethod
    async def get(db: AsyncSession, category_id: uuid.UUID):
        return await get_category_by_id(db, category_id)

    @staticmethod
    async def create(db: AsyncSession, restaurant_id: uuid.UUID, name: str, description: str | None = None):
        pos = await max_position(db, restaurant_id)
        payload = {"restaurant_id": restaurant_id, "name": name, "description": description, "position": pos + 1}
        try:
            return await create_category(db, **payload)
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

    @staticmethod
    async def update(db: AsyncSession, category, data: dict):
        return await update_category(db, category, data)

    @staticmethod
    async def delete(db: AsyncSession, category):
        return await delete_category(db, category)

    @staticmethod
    async def reorder(db: AsyncSession, restaurant_id: uuid.UUID, ids: list[str]):
        # naive reordering: set position according to list index
        from app.models.category import Category
        for idx, cid in enumerate(ids, start=1):
            cat = await get_category_by_id(db, uuid.UUID(cid))
            if not cat:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category {cid} not found")
            cat.position = idx
            db.add(cat)
        await db.commit()
        return await list_categories_by_restaurant(db, restaurant_id)
