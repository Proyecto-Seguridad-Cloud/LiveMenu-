import pytest
from types import SimpleNamespace
from uuid import uuid4

from httpx import AsyncClient, ASGITransport
from fastapi import HTTPException, status

from app.main import app
from app.services.auth_service import AuthService


@pytest.mark.asyncio
async def test_register_returns_201(override_db, monkeypatch):
    user_id = uuid4()

    async def fake_register(db, email, full_name, password):
        return SimpleNamespace(id=user_id, email=email, full_name=full_name)

    monkeypatch.setattr(AuthService, "register", staticmethod(fake_register))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/auth/register", json={
            "email": "new@test.com",
            "full_name": "New User",
            "password": "Password123!",
        })

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@test.com"
    assert data["full_name"] == "New User"


@pytest.mark.asyncio
async def test_register_returns_409_on_duplicate(override_db, monkeypatch):
    async def fake_register(db, email, full_name, password):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email ya registrado")

    monkeypatch.setattr(AuthService, "register", staticmethod(fake_register))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/auth/register", json={
            "email": "dup@test.com",
            "full_name": "Dup User",
            "password": "Password123!",
        })

    assert response.status_code == 409


@pytest.mark.asyncio
async def test_login_returns_token(override_db, monkeypatch):
    async def fake_login(db, email, password):
        return "fake-jwt-token"

    monkeypatch.setattr(AuthService, "login", staticmethod(fake_login))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/auth/login", json={
            "email": "user@test.com",
            "password": "Password123!",
        })

    assert response.status_code == 200
    data = response.json()
    assert data["access_token"] == "fake-jwt-token"
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_returns_401_on_bad_credentials(override_db, monkeypatch):
    async def fake_login(db, email, password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bad")

    monkeypatch.setattr(AuthService, "login", staticmethod(fake_login))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/auth/login", json={
            "email": "bad@test.com",
            "password": "wrong",
        })

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_returns_new_token(override_auth, monkeypatch):
    monkeypatch.setattr(AuthService, "refresh", staticmethod(lambda uid: "new-token"))

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/auth/refresh")

    assert response.status_code == 200
    assert response.json()["access_token"] == "new-token"


@pytest.mark.asyncio
async def test_logout_returns_message(override_auth):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/auth/logout")

    assert response.status_code == 200
    assert "cerrada" in response.json()["message"].lower()
