import hashlib
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.interaction_repository import (
    avg_scroll_depth,
    avg_session_duration,
    bulk_create_interactions,
    top_categories,
    top_dishes,
)
from app.repositories.restaurant_repository import get_restaurant_by_slug
from app.repositories.scan_event_repository import (
    count_scans_by_restaurant,
    count_unique_visitors,
    create_scan_event,
    device_breakdown,
    list_scans_by_restaurant,
    new_vs_returning,
    referrer_breakdown,
    scans_by_hour,
    scans_by_weekday,
    scans_per_day,
)

WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]


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
        since_7 = now - timedelta(days=7)
        since_30 = now - timedelta(days=30)

        # Existing metrics
        total = await count_scans_by_restaurant(db, restaurant_id)
        last_7 = await count_scans_by_restaurant(
            db, restaurant_id, since=since_7
        )
        last_30 = await count_scans_by_restaurant(
            db, restaurant_id, since=since_30
        )
        daily = await scans_per_day(db, restaurant_id, since=since_30)

        # Group A metrics
        unique = await count_unique_visitors(db, restaurant_id, since=since_30)
        hourly = await scans_by_hour(db, restaurant_id, since=since_30)
        weekday = await scans_by_weekday(db, restaurant_id, since=since_30)
        devices = await device_breakdown(db, restaurant_id, since=since_30)
        referrers = await referrer_breakdown(db, restaurant_id, since=since_30)
        new_ret = await new_vs_returning(db, restaurant_id, since=since_30)

        # Group B metrics
        session_dur = await avg_session_duration(
            db, restaurant_id, since=since_30
        )
        top_cats = await top_categories(db, restaurant_id, since=since_30)
        top_dsh = await top_dishes(db, restaurant_id, since=since_30)
        scroll = await avg_scroll_depth(db, restaurant_id, since=since_30)

        return {
            "total_scans": total,
            "scans_last_7_days": last_7,
            "scans_last_30_days": last_30,
            "daily_breakdown": [
                {"day": row.day, "count": row.count} for row in daily
            ],
            # Group A
            "unique_visitors": unique,
            "hourly_breakdown": [
                {"hour": int(row.hour), "count": row.count} for row in hourly
            ],
            "weekday_breakdown": [
                {
                    "weekday": int(row.weekday),
                    "label": WEEKDAY_LABELS[int(row.weekday)],
                    "count": row.count,
                }
                for row in weekday
            ],
            "device_breakdown": devices,
            "referrer_breakdown": referrers,
            "new_visitors": new_ret["new_visitors"],
            "returning_visitors": new_ret["returning_visitors"],
            # Group B
            "avg_session_duration_seconds": round(session_dur, 1),
            "top_categories": top_cats,
            "top_dishes": top_dsh,
            "avg_scroll_depth": round(scroll * 100, 1),
        }

    @staticmethod
    async def record_interactions(
        db: AsyncSession,
        slug: str,
        session_id: str,
        events: list[dict],
        ip: str | None = None,
    ) -> None:
        restaurant = await get_restaurant_by_slug(db, slug)
        if not restaurant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurante no encontrado",
            )

        ip_hash = AnalyticsService._hash_ip(ip) if ip else None
        records = [
            {
                "restaurant_id": restaurant.id,
                "session_id": session_id,
                "event_type": ev["event_type"],
                "payload": ev.get("payload", {}),
                "ip_hash": ip_hash,
            }
            for ev in events
        ]
        await bulk_create_interactions(db, records)

    @staticmethod
    async def export_csv(db: AsyncSession, restaurant_id: uuid.UUID) -> str:
        events = await list_scans_by_restaurant(db, restaurant_id, limit=10000)
        lines = ["timestamp,user_agent,ip_hash,referrer"]
        for ev in events:
            lines.append(
                f"{ev.timestamp},{ev.user_agent or ''},{ev.ip_hash or ''},{ev.referrer or ''}"
            )
        return "\n".join(lines)
