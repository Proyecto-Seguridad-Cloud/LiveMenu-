import uuid
import bcrypt
import jwt  
from datetime import datetime, timedelta, timezone
from app.core.config import settings
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from sqlalchemy import select
from app.models.user import User

bearer_scheme = HTTPBearer()

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

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db)
):

    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")

    return user