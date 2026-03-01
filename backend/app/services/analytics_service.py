import hashlib
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.restaurant_repository import get_restaurant_by_slug
from app.repositories.scan_event_repository import (
    count_scans_by_restaurant,
    create_scan_event,
    list_scans_by_restaurant,
    scans_per_day,
)


class AnalyticsService:
    @staticmethod
    def _hash_ip(ip: str) -> str:
        return hashlib.sha256(ip.encode()).hexdigest()[:16]

    @staticmethod
    async def record_scan(
        db: AsyncSession,
        slug: str,
        ip: str | None = None,
        user_agent: str | None = None,
        referrer: str | None = None,
    ) -> None:
        restaurant = await get_restaurant_by_slug(db, slug)
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurante no encontrado",
            )

        ip_hash = AnalyticsService._hash_ip(ip) if ip else None
        await create_scan_event(
            db,
            restaurant_id=restaurant.id,
            user_agent=user_agent,
            ip_hash=ip_hash,
            referrer=referrer,
        )

    @staticmethod
    async def get_summary(db: AsyncSession, restaurant_id: uuid.UUID) -> dict:
        now = datetime.now(timezone.utc)
        total = await count_scans_by_restaurant(db, restaurant_id)
        last_7 = await count_scans_by_restaurant(
            db, restaurant_id, since=now - timedelta(days=7)
        )
        last_30 = await count_scans_by_restaurant(
            db, restaurant_id, since=now - timedelta(days=30)
        )
        daily = await scans_per_day(
            db, restaurant_id, since=now - timedelta(days=30)
        )

        return {
            "total_scans": total,
            "scans_last_7_days": last_7,
            "scans_last_30_days": last_30,
            "daily_breakdown": [
                {"day": row.day, "count": row.count} for row in daily
            ],
        }

    @staticmethod
    async def export_csv(db: AsyncSession, restaurant_id: uuid.UUID) -> str:
        events = await list_scans_by_restaurant(db, restaurant_id, limit=10000)
        lines = ["timestamp,user_agent,ip_hash,referrer"]
        for ev in events:
            lines.append(
                f"{ev.timestamp},{ev.user_agent or ''},{ev.ip_hash or ''},{ev.referrer or ''}"
            )
        return "\n".join(lines)