from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ScanEventOut(BaseModel):
    id: UUID
    restaurant_id: UUID
    timestamp: datetime
    user_agent: str | None
    ip_hash: str | None
    referrer: str | None

    model_config = ConfigDict(from_attributes=True)


class DailyScanCount(BaseModel):
    day: date
    count: int


class AnalyticsSummary(BaseModel):
    total_scans: int
    scans_last_7_days: int
    scans_last_30_days: int
    daily_breakdown: list[DailyScanCount]
