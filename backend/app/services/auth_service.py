from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.user_repository import get_user_by_email, create_user
from app.core.security import hash_password, verify_password, create_access_token


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
        return {"message": "Sesión cerrada correctamente"}