import uuid
import bcrypt
import jwt  
from datetime import datetime, timedelta, timezone
from app.core.config import settings


def hash_password(password: str) -> str:
    hashed_pass = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed_pass.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw( plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(user_id: uuid.UUID) -> str:
    us_id = str(user_id)
    now = datetime.now(timezone.utc)
    expiration_date = now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)

    payload = {
        "sub": us_id,
        "iat": int(now.timestamp()),
        "exp": int(expiration_date.timestamp()),
        "type": "access",
        "jti": str(uuid.uuid4()),
    }

    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)