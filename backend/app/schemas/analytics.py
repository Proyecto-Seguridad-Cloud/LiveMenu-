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


class HourCount(BaseModel):
    hour: int
    count: int


class WeekdayCount(BaseModel):
    weekday: int
    label: str
    count: int


class DeviceCount(BaseModel):
    device: str
    count: int


class ReferrerCount(BaseModel):
    source: str
    count: int


class TopItem(BaseModel):
    name: str
    count: int


class AnalyticsSummary(BaseModel):
    # Existing
    total_scans: int
    scans_last_7_days: int
    scans_last_30_days: int
    daily_breakdown: list[DailyScanCount]
    # Group A
    unique_visitors: int = 0
    hourly_breakdown: list[HourCount] = []
    weekday_breakdown: list[WeekdayCount] = []
    device_breakdown: list[DeviceCount] = []
    referrer_breakdown: list[ReferrerCount] = []
    new_visitors: int = 0
    returning_visitors: int = 0
    # Group B
    avg_session_duration_seconds: float = 0.0
    top_categories: list[TopItem] = []
    top_dishes: list[TopItem] = []
    avg_scroll_depth: float = 0.0


class InteractionEventIn(BaseModel):
    event_type: str
    payload: dict
    timestamp: str | None = None


class InteractionBatchIn(BaseModel):
    session_id: str
    events: list[InteractionEventIn]
