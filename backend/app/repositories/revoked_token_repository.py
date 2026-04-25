from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.revoked_token import RevokedToken


async def revoke_token(db: AsyncSession, jti: str, expires_at: datetime | None):
    rt = RevokedToken(jti=jti, revoked_at=datetime.now(timezone.utc), expires_at=expires_at)
    db.add(rt)
    await db.commit()


async def is_revoked(db: AsyncSession, jti: str) -> bool:
    result = await db.execute(select(RevokedToken).where(RevokedToken.jti == jti))
    token = result.scalar_one_or_none()
    return token is not None
