from fastapi import APIRouter, Depends, status, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.db.session import get_db
from app.core.security import get_current_user
from app.services.category_service import CategoryService
from app.services.restaurant_service import RestaurantService
from app.schemas import CategoryCreate, CategoryUpdate, CategoryOut, ReorderRequest

router = APIRouter(prefix="/api/v1/admin/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut], summary="Listar categorías", description="Lista las categorías del restaurante del usuario autenticado, ordenadas por posición.")
async def list_categories(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    """Devuelve todas las categorías del restaurante del propietario autenticado."""
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")
    categories = await CategoryService.list(db, restaurant.id)
    return categories


@router.post("", status_code=status.HTTP_201_CREATED, response_model=CategoryOut, summary="Crear categoría", description="Crea una nueva categoría para el restaurante del usuario autenticado.")
async def create_category(payload: CategoryCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    """Crea una categoría y le asigna la siguiente posición disponible."""
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")
    cat = await CategoryService.create(db, restaurant.id, name=payload.name, description=payload.description)
    return cat


@router.put("/{category_id}", response_model=CategoryOut, summary="Actualizar categoría", description="Actualiza una categoría existente del restaurante del usuario autenticado.")
async def update_category(category_id: str = Path(...), payload: CategoryUpdate = None, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    """Actualiza nombre, descripción y estado de la categoría."""
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")

    category = await CategoryService.get_owned(db, restaurant.id, UUID(category_id))
    data = payload.model_dump(exclude_none=True)
    category = await CategoryService.update(db, category, data)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar categoría", description="Elimina una categoría si no tiene platos asociados.")
async def delete_category(category_id: str = Path(...), db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    """Elimina la categoría solicitada si está vacía."""
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")

    category = await CategoryService.get_owned(db, restaurant.id, UUID(category_id))
    await CategoryService.delete(db, category)
    return None


@router.patch("/reorder", response_model=list[CategoryOut], summary="Reordenar categorías", description="Actualiza la posición de las categorías según el orden de IDs proporcionado.")
async def reorder(payload: ReorderRequest, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    """Reordena categorías estableciendo `position` según el orden de `ids`."""
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")
    cats = await CategoryService.reorder(db, restaurant.id, payload.ids)
    return cats
