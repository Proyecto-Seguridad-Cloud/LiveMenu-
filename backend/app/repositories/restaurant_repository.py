import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.restaurant import Restaurant


async def get_restaurant_by_owner(db: AsyncSession, owner_id: uuid.UUID) -> Restaurant | None:
    result = await db.execute(select(Restaurant).where(Restaurant.owner_id == owner_id))
    return result.scalar_one_or_none()


async def get_restaurant_by_slug(db: AsyncSession, slug: str) -> Restaurant | None:
    result = await db.execute(select(Restaurant).where(Restaurant.slug == slug))
    return result.scalar_one_or_none()


async def create_restaurant(db: AsyncSession, **kwargs) -> Restaurant:
    restaurant = Restaurant(**kwargs)
    db.add(restaurant)
    await db.commit()
    await db.refresh(restaurant)
    return restaurant


async def update_restaurant(db: AsyncSession, restaurant: Restaurant, data: dict) -> Restaurant:
    for k, v in data.items():
        setattr(restaurant, k, v)
    db.add(restaurant)
    await db.commit()
    await db.refresh(restaurant)
    return restaurant


async def delete_restaurant(db: AsyncSession, restaurant: Restaurant) -> None:
    await db.delete(restaurant)
    await db.commit()
