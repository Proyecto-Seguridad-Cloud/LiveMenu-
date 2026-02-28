import uuid
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.category import Category
from app.models.dish import Dish
from app.repositories.dish_repository import (
    create_dish,
    get_dish_by_id,
    list_dishes,
    soft_delete_dish,
    update_dish,
)


class DishService:

    @staticmethod
    async def _get_owner_category(db: AsyncSession, category_id: uuid.UUID, restaurant_id: uuid.UUID) -> Category | None:
        result = await db.execute(
            select(Category).where(
                Category.id == category_id,
                Category.restaurant_id == restaurant_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    def _validate_prices(price: Decimal | None, price_offer: Decimal | None):
        if price is not None and price_offer is not None and price_offer >= price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El precio de oferta debe ser menor que el precio base",
            )

    @staticmethod
    async def list(db: AsyncSession, restaurant_id: uuid.UUID, category_id: uuid.UUID | None = None, available: bool | None = None) -> list[Dish]:
        if category_id:
            category = await DishService._get_owner_category(db, category_id, restaurant_id)
            if not category:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
            return await list_dishes(db, category_ids=[category_id], available=available)

        result = await db.execute(select(Category.id).where(Category.restaurant_id == restaurant_id))
        category_ids = [row[0] for row in result.all()]
        if not category_ids:
            return []
        return await list_dishes(db, category_ids=category_ids, available=available)

    @staticmethod
    async def get(db: AsyncSession, dish_id: uuid.UUID, restaurant_id: uuid.UUID) -> Dish:
        dish = await get_dish_by_id(db, dish_id)
        if not dish:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plato no encontrado")

        category = await DishService._get_owner_category(db, dish.category_id, restaurant_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plato no encontrado")

        return dish

    @staticmethod
    async def create(db: AsyncSession, restaurant_id: uuid.UUID, payload: dict) -> Dish:
        category_id = payload["category_id"]
        category = await DishService._get_owner_category(db, category_id, restaurant_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")

        DishService._validate_prices(payload.get("price"), payload.get("price_offer"))

        try:
            return await create_dish(db, **payload)
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

    @staticmethod
    async def update(db: AsyncSession, dish: Dish, restaurant_id: uuid.UUID, data: dict) -> Dish:
        next_category_id = data.get("category_id", dish.category_id)
        category = await DishService._get_owner_category(db, next_category_id, restaurant_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")

        next_price = data.get("price", dish.price)
        next_price_offer = data.get("price_offer", dish.price_offer)
        DishService._validate_prices(next_price, next_price_offer)

        return await update_dish(db, dish, data)

    @staticmethod
    async def update_availability(db: AsyncSession, dish: Dish, available: bool) -> Dish:
        return await update_dish(db, dish, {"available": available})

    @staticmethod
    async def delete(db: AsyncSession, dish: Dish) -> None:
        await soft_delete_dish(db, dish)
