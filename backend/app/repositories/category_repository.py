import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.category import Category
from app.models.dish import Dish
from sqlalchemy import delete


async def list_categories_by_restaurant(db: AsyncSession, restaurant_id: uuid.UUID) -> list[Category]:
    result = await db.execute(select(Category).where(Category.restaurant_id == restaurant_id).order_by(Category.position))
    return result.scalars().all()


async def get_category_by_id(db: AsyncSession, category_id: uuid.UUID) -> Category | None:
    result = await db.execute(select(Category).where(Category.id == category_id))
    return result.scalar_one_or_none()


async def create_category(db: AsyncSession, **kwargs) -> Category:
    category = Category(**kwargs)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def update_category(db: AsyncSession, category: Category, data: dict) -> Category:
    for k, v in data.items():
        setattr(category, k, v)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def delete_category(db: AsyncSession, category: Category) -> None:
    # Remove dependent dishes explicitly to keep persistence consistent
    await db.execute(delete(Dish).where(Dish.category_id == category.id))
    await db.delete(category)
    await db.commit()


async def max_position(db: AsyncSession, restaurant_id: uuid.UUID) -> int:
    result = await db.execute(select(func.max(Category.position)).where(Category.restaurant_id == restaurant_id))
    val = result.scalar_one_or_none()
    return int(val or 0)
