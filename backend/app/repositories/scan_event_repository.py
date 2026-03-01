import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scan_event import ScanEvent


async def create_scan_event(db: AsyncSession, **kwargs) -> ScanEvent:
    event = ScanEvent(**kwargs)
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


async def count_scans_by_restaurant(
    db: AsyncSession,
    restaurant_id: uuid.UUID,
    since: datetime | None = None,
) -> int:
    stmt = select(func.count(ScanEvent.id)).where(
        ScanEvent.restaurant_id == restaurant_id
    )
    if since:
        stmt = stmt.where(ScanEvent.timestamp >= since)
    result = await db.execute(stmt)
    return result.scalar() or 0


async def list_scans_by_restaurant(
    db: AsyncSession,
    restaurant_id: uuid.UUID,
    since: datetime | None = None,
    limit: int = 10000,
) -> list[ScanEvent]:
    stmt = (
        select(ScanEvent)
        .where(ScanEvent.restaurant_id == restaurant_id)
        .order_by(ScanEvent.timestamp.desc())
        .limit(limit)
    )
    if since:
        stmt = stmt.where(ScanEvent.timestamp >= since)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def scans_per_day(
    db: AsyncSession,
    restaurant_id: uuid.UUID,
    since: datetime | None = None,
) -> list[tuple]:
    day_col = func.date(ScanEvent.timestamp).label("day")
    stmt = (
        select(day_col, func.count(ScanEvent.id).label("count"))
        .where(ScanEvent.restaurant_id == restaurant_id)
        .group_by(day_col)
        .order_by(day_col)
    )
    if since:
        stmt = stmt.where(ScanEvent.timestamp >= since)
    result = await db.execute(stmt)
    return list(result.all())