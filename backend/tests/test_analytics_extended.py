"""Tests for Group A classifiers and the new interactions endpoint."""
import pytest
from types import SimpleNamespace
from uuid import uuid4

from httpx import AsyncClient, ASGITransport

from app.main import app
from app.repositories.scan_event_repository import classify_device, classify_referrer
from app.services.analytics_service import AnalyticsService


# --- classify_device ---

def test_classify_device_mobile_iphone():
    assert classify_device("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)") == "Mobile"


def test_classify_device_mobile_android():
    assert classify_device("Mozilla/5.0 (Linux; Android 13; Pixel 7)") == "Mobile"


def test_classify_device_tablet_ipad():
    assert classify_device("Mozilla/5.0 (iPad; CPU OS 16_0)") == "Tablet"


def test_classify_device_desktop():
    assert classify_device("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)") == "Desktop"


def test_classify_device_none():
    assert classify_device(None) == "Desktop"


# --- classify_referrer ---

def test_classify_referrer_direct():
    assert classify_referrer(None) == "Directo"
    assert classify_referrer("") == "Directo"


def test_classify_referrer_google():
    assert classify_referrer("https://www.google.com/search?q=menu") == "Google"


def test_classify_referrer_instagram():
    assert classify_referrer("https://l.instagram.com/?u=example") == "Instagram"


def test_classify_referrer_facebook():
    assert classify_referrer("https://m.facebook.com/story") == "Facebook"
    assert classify_referrer("https://lm.fb.com/l.php") == "Facebook"


def test_classify_referrer_twitter():
    assert classify_referrer("https://t.co/xyz") == "Twitter"


def test_classify_referrer_other():
    assert classify_referrer("https://example.com") == "Otro"


# --- POST /api/v1/menu/{slug}/interactions ---

@pytest.mark.asyncio
async def test_record_interactions_204(override_db, monkeypatch):
    async def fake_record_interactions(db, slug, session_id, events, ip=None):
        pass

    monkeypatch.setattr(
        AnalyticsService, "record_interactions", staticmethod(fake_record_interactions)
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/menu/test-rest/interactions",
            json={
                "session_id": "abc-123",
                "events": [
                    {"event_type": "category_view", "payload": {"category_name": "Entradas"}},
                    {"event_type": "dish_view", "payload": {"dish_name": "Ceviche"}},
                ],
            },
        )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_record_interactions_404(override_db, monkeypatch):
    from fastapi import HTTPException, status

    async def fake_record_interactions(db, slug, session_id, events, ip=None):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    monkeypatch.setattr(
        AnalyticsService, "record_interactions", staticmethod(fake_record_interactions)
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/menu/unknown/interactions",
            json={"session_id": "abc-123", "events": []},
        )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_record_interactions_422_invalid_body(override_db):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/menu/test-rest/interactions",
            json={"bad": "data"},
        )

    assert response.status_code == 422


# --- GET /api/v1/admin/analytics returns extended fields ---

@pytest.mark.asyncio
async def test_get_analytics_returns_extended_fields(override_auth, monkeypatch):
    from app.services.restaurant_service import RestaurantService

    rid = uuid4()

    async def fake_get_by_owner(db, owner_id):
        return SimpleNamespace(id=rid)

    async def fake_get_summary(db, restaurant_id):
        return {
            "total_scans": 42,
            "scans_last_7_days": 10,
            "scans_last_30_days": 30,
            "daily_breakdown": [],
            "unique_visitors": 20,
            "hourly_breakdown": [{"hour": 12, "count": 5}],
            "weekday_breakdown": [{"weekday": 1, "label": "Lun", "count": 8}],
            "device_breakdown": [{"device": "Mobile", "count": 25}],
            "referrer_breakdown": [{"source": "Directo", "count": 30}],
            "new_visitors": 15,
            "returning_visitors": 5,
            "avg_session_duration_seconds": 90.0,
            "top_categories": [{"name": "Bebidas", "count": 12}],
            "top_dishes": [{"name": "Lomo", "count": 7}],
            "avg_scroll_depth": 65.0,
        }

    monkeypatch.setattr(RestaurantService, "get_by_owner", staticmethod(fake_get_by_owner))
    monkeypatch.setattr(AnalyticsService, "get_summary", staticmethod(fake_get_summary))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/admin/analytics")

    assert response.status_code == 200
    body = response.json()
    assert body["unique_visitors"] == 20
    assert body["new_visitors"] == 15
    assert body["returning_visitors"] == 5
    assert body["avg_session_duration_seconds"] == 90.0
    assert body["avg_scroll_depth"] == 65.0
    assert len(body["device_breakdown"]) == 1
    assert len(body["top_categories"]) == 1
    assert len(body["top_dishes"]) == 1
