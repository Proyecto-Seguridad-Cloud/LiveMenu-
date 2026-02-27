from fastapi import APIRouter, Depends, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.auth_service import AuthService
from app.schemas import RegisterRequest, LoginRequest, TokenResponse
from app.core.security import get_current_user

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await AuthService.register(
        db,
        email=payload.email,
        full_name=payload.full_name,
        password=payload.password
    )
    return {"id": str(user.id), "email": user.email, "full_name": user.full_name}

@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request,payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    token = await AuthService.login(db, email=payload.email, password=payload.password)
    return TokenResponse(access_token=token, token_type="bearer")


