from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from app.core.config import settings
from app.db.session import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.repositories.user_repository import get_user_by_email, create_user  
from app.schemas import RegisterRequest, LoginRequest, TokenResponse 

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: Session = Depends(get_db)):

    existing = get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException( status_code=status.HTTP_409_CONFLICT, detail="Email ya registrado")

    user = create_user(db, email=payload.email, full_name=payload.full_name, 
                       password_hash=hash_password(payload.password))
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
    }


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):

    user = get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException( status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException( status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    token = create_access_token(user.id)

    return TokenResponse(access_token=token, token_type="bearer")