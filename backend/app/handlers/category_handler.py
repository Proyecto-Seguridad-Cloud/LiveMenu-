from fastapi import APIRouter, Depends, status, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.db.session import get_db
from app.core.security import get_current_user
from app.services.category_service import CategoryService
from app.services.restaurant_service import RestaurantService
from app.schemas import CategoryCreate, CategoryUpdate, CategoryOut, ReorderRequest

router = APIRouter(prefix="/api/v1/admin/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")
    categories = await CategoryService.list(db, restaurant.id)
    return categories


@router.post("", status_code=status.HTTP_201_CREATED, response_model=CategoryOut)
async def create_category(payload: CategoryCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")
    cat = await CategoryService.create(db, restaurant.id, name=payload.name, description=payload.description)
    return cat


@router.put("/{category_id}", response_model=CategoryOut)
async def update_category(category_id: str = Path(...), payload: CategoryUpdate = None, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    category = await CategoryService.get(db, UUID(category_id))
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    data = payload.dict(exclude_none=True)
    category = await CategoryService.update(db, category, data)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: str = Path(...), db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    category = await CategoryService.get(db, UUID(category_id))
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    await CategoryService.delete(db, category)
    return None


@router.patch("/reorder", response_model=list[CategoryOut])
async def reorder(payload: ReorderRequest, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")
    cats = await CategoryService.reorder(db, restaurant.id, payload.ids)
    return cats
