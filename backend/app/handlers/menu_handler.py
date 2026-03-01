from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.menu import PublicMenuResponse
from app.services.menu_service import MenuService


router = APIRouter(tags=["public-menu"])


@router.get("/api/v1/menu/{slug}", response_model=PublicMenuResponse)
async def get_public_menu(slug: str, db: AsyncSession = Depends(get_db)):
    return await MenuService.get_public_menu(db, slug)


@router.get("/m/{slug}", response_model=PublicMenuResponse)
async def get_public_menu_short(slug: str, db: AsyncSession = Depends(get_db)):
    return await MenuService.get_public_menu(db, slug)
