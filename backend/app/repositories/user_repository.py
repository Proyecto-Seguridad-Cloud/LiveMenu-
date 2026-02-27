from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, email: str, full_name: str, password_hash: str) -> User:
    user = User(email=email, full_name=full_name, hashed_password=password_hash)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user