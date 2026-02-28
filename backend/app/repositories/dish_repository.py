import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.dish import Dish


async def list_dishes(db: AsyncSession, category_ids: list[uuid.UUID] | None = None, available: bool | None = None) -> list[Dish]:
    query = select(Dish).where(Dish.deleted_at.is_(None)).order_by(Dish.position, Dish.created_at)

    if category_ids:
        query = query.where(Dish.category_id.in_(category_ids))
    if available is not None:
        query = query.where(Dish.available == available)

    result = await db.execute(query)
    return result.scalars().all()


async def get_dish_by_id(db: AsyncSession, dish_id: uuid.UUID) -> Dish | None:
    result = await db.execute(select(Dish).where(Dish.id == dish_id, Dish.deleted_at.is_(None)))
    return result.scalar_one_or_none()


async def create_dish(db: AsyncSession, **kwargs) -> Dish:
    dish = Dish(**kwargs)
    db.add(dish)
    await db.commit()
    await db.refresh(dish)
    return dish


async def update_dish(db: AsyncSession, dish: Dish, data: dict) -> Dish:
    for k, v in data.items():
        setattr(dish, k, v)
    db.add(dish)
    await db.commit()
    await db.refresh(dish)
    return dish


async def soft_delete_dish(db: AsyncSession, dish: Dish) -> None:
    dish.deleted_at = datetime.now(timezone.utc)
    db.add(dish)
    await db.commit()
