from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.user_repository import get_user_by_email, create_user
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.repositories.revoked_token_repository import revoke_token
from datetime import datetime



class AuthService:

    @staticmethod
    async def register(db: AsyncSession, email: str, full_name: str, password: str):
        existing_user = await get_user_by_email(db, email)
        if existing_user:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email ya registrado")

        password_hash = hash_password(password)
        user = await create_user(db, email=email, full_name=full_name, password_hash=password_hash)
        return user

    @staticmethod
    async def login(db: AsyncSession, email: str, password: str) -> str:
        user = await get_user_by_email(db, email)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o Contraseña incorrectos")

        if not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o Contraseña incorrectos")

        return create_access_token(user.id)

    @staticmethod
    def refresh(user_id) -> str:
        return create_access_token(user_id)

    @staticmethod
    def logout() -> dict:
        # Legacy placeholder kept for tests that expect a simple message.
        return {"message": "Sesión cerrada correctamente"}

    @staticmethod
    async def revoke(db: AsyncSession, token: str) -> dict:
        # Decode token to get jti and exp
        payload = decode_token(token)
        jti = payload.get("jti")
        exp_ts = payload.get("exp")
        expires_at = None
        if exp_ts:
            expires_at = datetime.fromtimestamp(int(exp_ts))

        if jti:
            await revoke_token(db, jti, expires_at)

        return {"message": "Sesión cerrada correctamente"}