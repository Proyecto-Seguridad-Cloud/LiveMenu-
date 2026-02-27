from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.security import get_current_user
from app.services.restaurant_service import RestaurantService
from app.schemas import RestaurantCreate, RestaurantUpdate, RestaurantOut

router = APIRouter(prefix="/api/v1/admin/restaurant", tags=["restaurant"])


@router.get("", response_model=RestaurantOut)
async def get_restaurant(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")
    return restaurant


@router.post("", status_code=status.HTTP_201_CREATED, response_model=RestaurantOut)
async def create_restaurant(payload: RestaurantCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    restaurant = await RestaurantService.create(db, owner_id=current_user.id, name=payload.name, description=payload.description, logo_url=str(payload.logo_url) if payload.logo_url else None, phone=payload.phone, address=payload.address, hours=payload.hours)
    return restaurant


@router.put("", response_model=RestaurantOut)
async def update_restaurant(payload: RestaurantUpdate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")
    data = payload.dict(exclude_none=True)
    restaurant = await RestaurantService.update(db, restaurant, data)
    return restaurant


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_restaurant(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")
    await RestaurantService.delete(db, restaurant)
    return None
