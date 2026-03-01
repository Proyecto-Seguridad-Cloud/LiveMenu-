import pytest
from types import SimpleNamespace
from uuid import uuid4

from httpx import AsyncClient, ASGITransport

from app.main import app
from app.services.analytics_service import AnalyticsService
from app.services.restaurant_service import RestaurantService


@pytest.mark.asyncio
async def test_record_scan_204(override_db, monkeypatch):
    async def fake_record_scan(db, slug, **kwargs):
        pass

    monkeypatch.setattr(AnalyticsService, "record_scan", staticmethod(fake_record_scan))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/menu/test-rest/scan")

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_record_scan_404_unknown_slug(override_db, monkeypatch):
    from fastapi import HTTPException, status

    async def fake_record_scan(db, slug, **kwargs):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    monkeypatch.setattr(AnalyticsService, "record_scan", staticmethod(fake_record_scan))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/menu/unknown/scan")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_analytics_200(override_auth, monkeypatch):
    rid = uuid4()

    async def fake_get_by_owner(db, owner_id):
        return SimpleNamespace(id=rid)

    async def fake_get_summary(db, restaurant_id):
        return {
            "total_scans": 42,
            "scans_last_7_days": 10,
            "scans_last_30_days": 30,
            "daily_breakdown": [],
        }

    monkeypatch.setattr(RestaurantService, "get_by_owner", staticmethod(fake_get_by_owner))
    monkeypatch.setattr(AnalyticsService, "get_summary", staticmethod(fake_get_summary))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/admin/analytics")

    assert response.status_code == 200
    assert response.json()["total_scans"] == 42


@pytest.mark.asyncio
async def test_get_analytics_404_no_restaurant(override_auth, monkeypatch):
    async def fake_get_by_owner(db, owner_id):
        return None

    monkeypatch.setattr(RestaurantService, "get_by_owner", staticmethod(fake_get_by_owner))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/admin/analytics")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_export_csv_200(override_auth, monkeypatch):
    rid = uuid4()

    async def fake_get_by_owner(db, owner_id):
        return SimpleNamespace(id=rid)

    async def fake_export_csv(db, restaurant_id):
        return "timestamp,user_agent,ip_hash,referrer\n2025-01-01,Mozilla,abc,ref"

    monkeypatch.setattr(RestaurantService, "get_by_owner", staticmethod(fake_get_by_owner))
    monkeypatch.setattr(AnalyticsService, "export_csv", staticmethod(fake_export_csv))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/admin/analytics/export")

    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "timestamp" in response.text


@pytest.mark.asyncio
async def test_export_csv_404_no_restaurant(override_auth, monkeypatch):
    async def fake_get_by_owner(db, owner_id):
        return None

    monkeypatch.setattr(RestaurantService, "get_by_owner", staticmethod(fake_get_by_owner))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/admin/analytics/export")

    assert response.status_code == 404
