from datetime import date, datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.services import analytics_service
from app.services.analytics_service import AnalyticsService


def test_hash_ip_returns_16_char_hex():
    result = AnalyticsService._hash_ip("192.168.1.1")
    assert isinstance(result, str)
    assert len(result) == 16


def test_hash_ip_is_deterministic():
    a = AnalyticsService._hash_ip("10.0.0.1")
    b = AnalyticsService._hash_ip("10.0.0.1")
    assert a == b


def test_hash_ip_differs_for_different_ips():
    a = AnalyticsService._hash_ip("10.0.0.1")
    b = AnalyticsService._hash_ip("10.0.0.2")
    assert a != b


@pytest.mark.asyncio
async def test_record_scan_creates_event(monkeypatch):
    restaurant = SimpleNamespace(id=uuid4())

    async def fake_get_restaurant(db, slug):
        return restaurant if slug == "test-rest" else None

    created = {}

    async def fake_create(db, **kwargs):
        created.update(kwargs)

    monkeypatch.setattr(analytics_service, "get_restaurant_by_slug", fake_get_restaurant)
    monkeypatch.setattr(analytics_service, "create_scan_event", fake_create)

    await AnalyticsService.record_scan(
        SimpleNamespace(), "test-rest",
        ip="1.2.3.4", user_agent="Mozilla", referrer="https://google.com",
    )

    assert created["restaurant_id"] == restaurant.id
    assert created["user_agent"] == "Mozilla"
    assert created["ip_hash"] is not None
    assert len(created["ip_hash"]) == 16


@pytest.mark.asyncio
async def test_record_scan_raises_when_slug_not_found(monkeypatch):
    async def fake_get_restaurant(db, slug):
        return None

    monkeypatch.setattr(analytics_service, "get_restaurant_by_slug", fake_get_restaurant)

    with pytest.raises(HTTPException) as exc:
        await AnalyticsService.record_scan(SimpleNamespace(), "nope")

    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_record_scan_none_ip_sets_null_hash(monkeypatch):
    restaurant = SimpleNamespace(id=uuid4())

    async def fake_get_restaurant(db, slug):
        return restaurant

    created = {}

    async def fake_create(db, **kwargs):
        created.update(kwargs)

    monkeypatch.setattr(analytics_service, "get_restaurant_by_slug", fake_get_restaurant)
    monkeypatch.setattr(analytics_service, "create_scan_event", fake_create)

    await AnalyticsService.record_scan(SimpleNamespace(), "test", ip=None)
    assert created["ip_hash"] is None


@pytest.mark.asyncio
async def test_get_summary_aggregates_all_metrics(monkeypatch):
    rid = uuid4()

    async def fake_count(db, restaurant_id, since=None):
        return 100 if since is None else 10

    async def fake_per_day(db, restaurant_id, since=None):
        return [
            SimpleNamespace(day=date(2025, 1, 1), count=5),
            SimpleNamespace(day=date(2025, 1, 2), count=3),
        ]

    async def fake_unique(db, restaurant_id, since=None):
        return 42

    async def fake_by_hour(db, restaurant_id, since=None):
        return [SimpleNamespace(hour=14, count=20)]

    async def fake_by_weekday(db, restaurant_id, since=None):
        return [SimpleNamespace(weekday=1, count=15)]

    async def fake_devices(db, restaurant_id, since=None):
        return [{"device": "Mobile", "count": 60}]

    async def fake_referrers(db, restaurant_id, since=None):
        return [{"source": "Directo", "count": 50}]

    async def fake_new_ret(db, restaurant_id, since=None):
        return {"new_visitors": 30, "returning_visitors": 12}

    async def fake_session_dur(db, restaurant_id, since=None):
        return 125.5

    async def fake_top_cats(db, restaurant_id, since=None):
        return [{"name": "Entradas", "count": 10}]

    async def fake_top_dishes(db, restaurant_id, since=None):
        return [{"name": "Ceviche", "count": 8}]

    async def fake_scroll(db, restaurant_id, since=None):
        return 0.72

    monkeypatch.setattr(analytics_service, "count_scans_by_restaurant", fake_count)
    monkeypatch.setattr(analytics_service, "scans_per_day", fake_per_day)
    monkeypatch.setattr(analytics_service, "count_unique_visitors", fake_unique)
    monkeypatch.setattr(analytics_service, "scans_by_hour", fake_by_hour)
    monkeypatch.setattr(analytics_service, "scans_by_weekday", fake_by_weekday)
    monkeypatch.setattr(analytics_service, "device_breakdown", fake_devices)
    monkeypatch.setattr(analytics_service, "referrer_breakdown", fake_referrers)
    monkeypatch.setattr(analytics_service, "new_vs_returning", fake_new_ret)
    monkeypatch.setattr(analytics_service, "avg_session_duration", fake_session_dur)
    monkeypatch.setattr(analytics_service, "top_categories", fake_top_cats)
    monkeypatch.setattr(analytics_service, "top_dishes", fake_top_dishes)
    monkeypatch.setattr(analytics_service, "avg_scroll_depth", fake_scroll)

    result = await AnalyticsService.get_summary(SimpleNamespace(), rid)

    # Existing metrics
    assert result["total_scans"] == 100
    assert result["scans_last_7_days"] == 10
    assert result["scans_last_30_days"] == 10
    assert len(result["daily_breakdown"]) == 2
    # Group A
    assert result["unique_visitors"] == 42
    assert result["hourly_breakdown"] == [{"hour": 14, "count": 20}]
    assert result["weekday_breakdown"] == [{"weekday": 1, "label": "Lun", "count": 15}]
    assert result["device_breakdown"] == [{"device": "Mobile", "count": 60}]
    assert result["referrer_breakdown"] == [{"source": "Directo", "count": 50}]
    assert result["new_visitors"] == 30
    assert result["returning_visitors"] == 12
    # Group B
    assert result["avg_session_duration_seconds"] == 125.5
    assert result["top_categories"] == [{"name": "Entradas", "count": 10}]
    assert result["top_dishes"] == [{"name": "Ceviche", "count": 8}]
    assert result["avg_scroll_depth"] == 72.0


@pytest.mark.asyncio
async def test_record_interactions_creates_batch(monkeypatch):
    restaurant = SimpleNamespace(id=uuid4())

    async def fake_get_restaurant(db, slug):
        return restaurant

    created = []

    async def fake_bulk(db, events):
        created.extend(events)

    monkeypatch.setattr(analytics_service, "get_restaurant_by_slug", fake_get_restaurant)
    monkeypatch.setattr(analytics_service, "bulk_create_interactions", fake_bulk)

    events = [
        {"event_type": "category_view", "payload": {"category_name": "Entradas"}},
        {"event_type": "dish_view", "payload": {"dish_name": "Ceviche"}},
    ]
    await AnalyticsService.record_interactions(
        SimpleNamespace(), "test-rest", session_id="sess123", events=events, ip="1.2.3.4"
    )

    assert len(created) == 2
    assert created[0]["event_type"] == "category_view"
    assert created[0]["restaurant_id"] == restaurant.id
    assert created[0]["session_id"] == "sess123"
    assert created[0]["ip_hash"] is not None


@pytest.mark.asyncio
async def test_record_interactions_raises_for_unknown_slug(monkeypatch):
    async def fake_get_restaurant(db, slug):
        return None

    monkeypatch.setattr(analytics_service, "get_restaurant_by_slug", fake_get_restaurant)

    with pytest.raises(HTTPException) as exc:
        await AnalyticsService.record_interactions(
            SimpleNamespace(), "nope", session_id="s", events=[]
        )

    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_export_csv_formats_correctly(monkeypatch):
    events = [
        SimpleNamespace(
            timestamp=datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc),
            user_agent="Mozilla",
            ip_hash="abc123",
            referrer="https://google.com",
        ),
    ]

    async def fake_list(db, restaurant_id, limit=10000):
        return events

    monkeypatch.setattr(analytics_service, "list_scans_by_restaurant", fake_list)

    csv = await AnalyticsService.export_csv(SimpleNamespace(), uuid4())
    lines = csv.strip().split("\n")

    assert lines[0] == "timestamp,user_agent,ip_hash,referrer"
    assert "Mozilla" in lines[1]
    assert "abc123" in lines[1]


@pytest.mark.asyncio
async def test_export_csv_handles_empty_events(monkeypatch):
    async def fake_list(db, restaurant_id, limit=10000):
        return []

    monkeypatch.setattr(analytics_service, "list_scans_by_restaurant", fake_list)

    csv = await AnalyticsService.export_csv(SimpleNamespace(), uuid4())
    assert csv == "timestamp,user_agent,ip_hash,referrer"


@pytest.mark.asyncio
async def test_export_csv_handles_none_fields(monkeypatch):
    events = [
        SimpleNamespace(
            timestamp=datetime(2025, 3, 15, 8, 0, 0, tzinfo=timezone.utc),
            user_agent=None,
            ip_hash=None,
            referrer=None,
        ),
    ]

    async def fake_list(db, restaurant_id, limit=10000):
        return events

    monkeypatch.setattr(analytics_service, "list_scans_by_restaurant", fake_list)

    csv = await AnalyticsService.export_csv(SimpleNamespace(), uuid4())
    lines = csv.strip().split("\n")
    assert len(lines) == 2
    assert "2025-03-15" in lines[1]
