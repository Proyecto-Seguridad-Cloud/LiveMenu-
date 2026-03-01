import uuid
from datetime import datetime

from sqlalchemy import Float, cast, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu_interaction import MenuInteractionEvent


async def bulk_create_interactions(
    db: AsyncSession, events: list[dict]
) -> None:
    objects = [MenuInteractionEvent(**ev) for ev in events]
    db.add_all(objects)
    await db.commit()


async def avg_session_duration(
    db: AsyncSession,
    restaurant_id: uuid.UUID,
    since: datetime | None = None,
) -> float:
    min_ts = func.min(MenuInteractionEvent.timestamp).label("min_ts")
    max_ts = func.max(MenuInteractionEvent.timestamp).label("max_ts")
    sub = (
        select(
            MenuInteractionEvent.session_id,
            min_ts,
            max_ts,
        )
        .where(MenuInteractionEvent.restaurant_id == restaurant_id)
        .group_by(MenuInteractionEvent.session_id)
        .subquery()
    )
    if since:
        sub = (
            select(
                MenuInteractionEvent.session_id,
                min_ts,
                max_ts,
            )
            .where(
                MenuInteractionEvent.restaurant_id == restaurant_id,
                MenuInteractionEvent.timestamp >= since,
            )
            .group_by(MenuInteractionEvent.session_id)
            .subquery()
        )

    duration = func.extract("epoch", sub.c.max_ts - sub.c.min_ts)
    stmt = select(func.avg(duration).label("avg_dur")).select_from(sub)
    result = await db.execute(stmt)
    return float(result.scalar() or 0.0)


async def top_categories(
    db: AsyncSession,
    restaurant_id: uuid.UUID,
    since: datetime | None = None,
    limit: int = 10,
) -> list[dict]:
    cat_name = MenuInteractionEvent.payload["category_name"].astext.label(
        "name"
    )
    stmt = (
        select(cat_name, func.count(MenuInteractionEvent.id).label("count"))
        .where(
            MenuInteractionEvent.restaurant_id == restaurant_id,
            MenuInteractionEvent.event_type == "category_view",
        )
        .group_by(cat_name)
        .order_by(func.count(MenuInteractionEvent.id).desc())
        .limit(limit)
    )
    if since:
        stmt = stmt.where(MenuInteractionEvent.timestamp >= since)
    result = await db.execute(stmt)
    return [{"name": row.name, "count": row.count} for row in result.all()]


async def top_dishes(
    db: AsyncSession,
    restaurant_id: uuid.UUID,
    since: datetime | None = None,
    limit: int = 10,
) -> list[dict]:
    dish_name = MenuInteractionEvent.payload["dish_name"].astext.label("name")
    stmt = (
        select(dish_name, func.count(MenuInteractionEvent.id).label("count"))
        .where(
            MenuInteractionEvent.restaurant_id == restaurant_id,
            MenuInteractionEvent.event_type == "dish_view",
        )
        .group_by(dish_name)
        .order_by(func.count(MenuInteractionEvent.id).desc())
        .limit(limit)
    )
    if since:
        stmt = stmt.where(MenuInteractionEvent.timestamp >= since)
    result = await db.execute(stmt)
    return [{"name": row.name, "count": row.count} for row in result.all()]


async def avg_scroll_depth(
    db: AsyncSession,
    restaurant_id: uuid.UUID,
    since: datetime | None = None,
) -> float:
    depth_col = cast(
        MenuInteractionEvent.payload["depth"].astext, Float
    ).label("depth")
    stmt = (
        select(func.avg(depth_col).label("avg_depth"))
        .where(
            MenuInteractionEvent.restaurant_id == restaurant_id,
            MenuInteractionEvent.event_type == "scroll_depth",
        )
    )
    if since:
        stmt = stmt.where(MenuInteractionEvent.timestamp >= since)
    result = await db.execute(stmt)
    return float(result.scalar() or 0.0)
