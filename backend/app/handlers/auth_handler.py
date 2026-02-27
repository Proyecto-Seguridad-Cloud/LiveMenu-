from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.auth_service import AuthService
from app.schemas import RegisterRequest, LoginRequest, TokenResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await AuthService.register(
        db,
        email=payload.email,
        full_name=payload.full_name,
        password=payload.password
    )
    return {"id": str(user.id), "email": user.email, "full_name": user.full_name}

@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    token = await AuthService.login(db, email=payload.email, password=payload.password)
    return TokenResponse(access_token=token, token_type="bearer")



@router.get("/me")
async def me(current_user = Depends(get_current_user)):
    return {"id": str(current_user.id), "email": current_user.email, "full_name": current_user.full_name}