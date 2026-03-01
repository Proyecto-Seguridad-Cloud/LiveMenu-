import pytest
from types import SimpleNamespace
from uuid import uuid4

from app.main import app
from app.db.session import get_db
from app.core.security import get_current_user


@pytest.fixture
def fake_user():
    return SimpleNamespace(
        id=uuid4(),
        email="test@livemenu.dev",
        full_name="Test User",
        hashed_password="hashed",
    )


@pytest.fixture
def fake_db():
    return SimpleNamespace()


@pytest.fixture
def override_auth(fake_user, fake_db):
    """Override get_db and get_current_user for authenticated endpoints."""
    app.dependency_overrides[get_db] = lambda: fake_db
    app.dependency_overrides[get_current_user] = lambda: fake_user
    yield fake_db, fake_user
    app.dependency_overrides.clear()


@pytest.fixture
def override_db(fake_db):
    """Override only get_db for public endpoints."""
    app.dependency_overrides[get_db] = lambda: fake_db
    yield fake_db
    app.dependency_overrides.clear()
