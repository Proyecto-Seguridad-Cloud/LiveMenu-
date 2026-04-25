import pytest
import uuid
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_e2e_auth_logout_revokes_token():
    email = f"e2e+{uuid.uuid4().hex[:8]}@example.com"
    password = "Pass1234"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register
        r = await client.post(
            "/api/v1/auth/register",
            json={"email": email, "full_name": "E2E User", "password": password},
        )
        assert r.status_code in (200, 201)

        # Login
        r = await client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password},
        )
        assert r.status_code == 200
        data = r.json()
        token = data.get("access_token")
        assert token

        headers = {"Authorization": f"Bearer {token}"}

        # Logout (revoke)
        r = await client.post("/api/v1/auth/logout", headers=headers)
        assert r.status_code == 200

        # Using same token for refresh should now fail (revoked)
        r = await client.post("/api/v1/auth/refresh", headers=headers)
        assert r.status_code == 401
