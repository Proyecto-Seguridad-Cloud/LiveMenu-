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
async def test_get_summary_aggregates_counts(monkeypatch):
    rid = uuid4()

    async def fake_count(db, restaurant_id, since=None):
        return 100 if since is None else 10

    async def fake_per_day(db, restaurant_id, since=None):
        return [
            SimpleNamespace(day=date(2025, 1, 1), count=5),
            SimpleNamespace(day=date(2025, 1, 2), count=3),
        ]

    monkeypatch.setattr(analytics_service, "count_scans_by_restaurant", fake_count)
    monkeypatch.setattr(analytics_service, "scans_per_day", fake_per_day)

    result = await AnalyticsService.get_summary(SimpleNamespace(), rid)

    assert result["total_scans"] == 100
    assert result["scans_last_7_days"] == 10
    assert result["scans_last_30_days"] == 10
    assert len(result["daily_breakdown"]) == 2


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
