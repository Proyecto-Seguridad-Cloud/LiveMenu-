import re
import uuid
from collections import Counter
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


async def count_unique_visitors(
    db: AsyncSession,
    restaurant_id: uuid.UUID,
    since: datetime | None = None,
) -> int:
    stmt = select(func.count(func.distinct(ScanEvent.ip_hash))).where(
        ScanEvent.restaurant_id == restaurant_id,
        ScanEvent.ip_hash.is_not(None),
    )
    if since:
        stmt = stmt.where(ScanEvent.timestamp >= since)
    result = await db.execute(stmt)
    return result.scalar() or 0


async def scans_by_hour(
    db: AsyncSession,
    restaurant_id: uuid.UUID,
    since: datetime | None = None,
) -> list[tuple]:
    hour_col = func.extract("hour", ScanEvent.timestamp).label("hour")
    stmt = (
        select(hour_col, func.count(ScanEvent.id).label("count"))
        .where(ScanEvent.restaurant_id == restaurant_id)
        .group_by(hour_col)
        .order_by(hour_col)
    )
    if since:
        stmt = stmt.where(ScanEvent.timestamp >= since)
    result = await db.execute(stmt)
    return list(result.all())


async def scans_by_weekday(
    db: AsyncSession,
    restaurant_id: uuid.UUID,
    since: datetime | None = None,
) -> list[tuple]:
    dow_col = func.extract("dow", ScanEvent.timestamp).label("weekday")
    stmt = (
        select(dow_col, func.count(ScanEvent.id).label("count"))
        .where(ScanEvent.restaurant_id == restaurant_id)
        .group_by(dow_col)
        .order_by(dow_col)
    )
    if since:
        stmt = stmt.where(ScanEvent.timestamp >= since)
    result = await db.execute(stmt)
    return list(result.all())


def classify_device(user_agent: str | None) -> str:
    if not user_agent:
        return "Desktop"
    ua = user_agent.lower()
    # Check tablet BEFORE mobile — iPad UAs contain "Mobile" in their string
    if re.search(r"ipad|tablet|kindle|silk|playbook", ua):
        return "Tablet"
    if re.search(r"mobile|android|iphone|ipod|blackberry|opera mini|iemobile", ua):
        return "Mobile"
    return "Desktop"


def classify_referrer(referrer: str | None) -> str:
    if not referrer:
        return "Directo"
    ref = referrer.lower()
    if "google" in ref:
        return "Google"
    if "instagram" in ref:
        return "Instagram"
    if "facebook" in ref or "fb.com" in ref:
        return "Facebook"
    if "twitter" in ref or "t.co" in ref:
        return "Twitter"
    return "Otro"


async def device_breakdown(
    db: AsyncSession,
    restaurant_id: uuid.UUID,
    since: datetime | None = None,
) -> list[dict]:
    stmt = select(ScanEvent.user_agent).where(
        ScanEvent.restaurant_id == restaurant_id
    )
    if since:
        stmt = stmt.where(ScanEvent.timestamp >= since)
    result = await db.execute(stmt)
    agents = [row[0] for row in result.all()]
    counts = Counter(classify_device(ua) for ua in agents)
    return [{"device": k, "count": v} for k, v in counts.most_common()]


async def referrer_breakdown(
    db: AsyncSession,
    restaurant_id: uuid.UUID,
    since: datetime | None = None,
) -> list[dict]:
    stmt = select(ScanEvent.referrer).where(
        ScanEvent.restaurant_id == restaurant_id
    )
    if since:
        stmt = stmt.where(ScanEvent.timestamp >= since)
    result = await db.execute(stmt)
    referrers = [row[0] for row in result.all()]
    counts = Counter(classify_referrer(r) for r in referrers)
    return [{"source": k, "count": v} for k, v in counts.most_common()]


async def new_vs_returning(
    db: AsyncSession,
    restaurant_id: uuid.UUID,
    since: datetime | None = None,
) -> dict:
    since_val = since
    # Get the first-seen timestamp for each ip_hash
    first_seen = (
        select(
            ScanEvent.ip_hash,
            func.min(ScanEvent.timestamp).label("first_ts"),
        )
        .where(
            ScanEvent.restaurant_id == restaurant_id,
            ScanEvent.ip_hash.is_not(None),
        )
        .group_by(ScanEvent.ip_hash)
        .subquery()
    )

    if since_val:
        # Visitors whose first visit is within the period = new
        new_stmt = select(func.count()).select_from(first_seen).where(
            first_seen.c.first_ts >= since_val
        )
        returning_stmt = select(func.count()).select_from(first_seen).where(
            first_seen.c.first_ts < since_val
        )
    else:
        # Without a date filter, all are "new" (first visit exists)
        new_stmt = select(func.count()).select_from(first_seen)
        returning_stmt = select(func.literal(0))

    new_result = await db.execute(new_stmt)
    ret_result = await db.execute(returning_stmt)
    return {
        "new_visitors": new_result.scalar() or 0,
        "returning_visitors": ret_result.scalar() or 0,
    }
