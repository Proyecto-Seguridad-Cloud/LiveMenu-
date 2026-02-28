from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_current_user
from app.db.session import get_db
from app.schemas import DishCreate, DishUpdate, DishOut, DishAvailabilityUpdate
from app.services.dish_service import DishService
from app.services.restaurant_service import RestaurantService

router = APIRouter(prefix="/api/v1/admin/dishes", tags=["dishes"])


@router.get("", response_model=list[DishOut])
async def list_dishes(
    category_id: UUID | None = Query(default=None),
    available: bool | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")

    return await DishService.list(db, restaurant.id, category_id=category_id, available=available)


@router.get("/{dish_id}", response_model=DishOut)
async def get_dish(dish_id: UUID, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")

    return await DishService.get(db, dish_id, restaurant.id)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=DishOut)
async def create_dish(payload: DishCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")

    return await DishService.create(db, restaurant.id, payload.model_dump())


@router.put("/{dish_id}", response_model=DishOut)
async def update_dish(dish_id: UUID, payload: DishUpdate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")

    dish = await DishService.get(db, dish_id, restaurant.id)
    return await DishService.update(db, dish, restaurant.id, payload.model_dump(exclude_none=True))


@router.delete("/{dish_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dish(dish_id: UUID, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")

    dish = await DishService.get(db, dish_id, restaurant.id)
    await DishService.delete(db, dish)
    return None


@router.patch("/{dish_id}/availability", response_model=DishOut)
async def update_availability(
    dish_id: UUID,
    payload: DishAvailabilityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")

    dish = await DishService.get(db, dish_id, restaurant.id)
    return await DishService.update_availability(db, dish, payload.available)
