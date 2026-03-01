from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.services import auth_service
from app.services.auth_service import AuthService


@pytest.mark.asyncio
async def test_register_rejects_existing_email(monkeypatch):
    async def fake_get_user_by_email(db, email):
        _ = db, email
        return SimpleNamespace(id=uuid4())

    monkeypatch.setattr(auth_service, "get_user_by_email", fake_get_user_by_email)

    with pytest.raises(HTTPException) as exc:
        await AuthService.register(SimpleNamespace(), "a@b.com", "name", "Password123")

    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_register_success(monkeypatch):
    async def fake_get_user_by_email(db, email):
        _ = db, email
        return None

    async def fake_create_user(db, email, full_name, password_hash):
        _ = db, password_hash
        return SimpleNamespace(id=uuid4(), email=email, full_name=full_name)

    monkeypatch.setattr(auth_service, "get_user_by_email", fake_get_user_by_email)
    monkeypatch.setattr(auth_service, "create_user", fake_create_user)
    monkeypatch.setattr(auth_service, "hash_password", lambda pwd: f"hashed-{pwd}")

    user = await AuthService.register(SimpleNamespace(), "ok@dev.com", "OK", "Password123")
    assert user.email == "ok@dev.com"


@pytest.mark.asyncio
async def test_login_rejects_invalid_credentials(monkeypatch):
    async def fake_get_user_by_email(db, email):
        _ = db, email
        return None

    monkeypatch.setattr(auth_service, "get_user_by_email", fake_get_user_by_email)

    with pytest.raises(HTTPException) as exc:
        await AuthService.login(SimpleNamespace(), "x@x.com", "bad")

    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_login_success(monkeypatch):
    user = SimpleNamespace(id=uuid4(), hashed_password="hashed")

    async def fake_get_user_by_email(db, email):
        _ = db, email
        return user

    monkeypatch.setattr(auth_service, "get_user_by_email", fake_get_user_by_email)
    monkeypatch.setattr(auth_service, "verify_password", lambda plain, hashed: True)
    monkeypatch.setattr(auth_service, "create_access_token", lambda uid: f"token-{uid}")

    token = await AuthService.login(SimpleNamespace(), "x@x.com", "Password123")
    assert token.startswith("token-")


def test_refresh_issues_new_access_token(monkeypatch):
    user_id = uuid4()
    monkeypatch.setattr(auth_service, "create_access_token", lambda uid: f"new-token-{uid}")

    token = AuthService.refresh(user_id)

    assert token.startswith("new-token-")


def test_logout_returns_success_message():
    result = AuthService.logout()

    assert result == {"message": "Sesión cerrada correctamente"}
