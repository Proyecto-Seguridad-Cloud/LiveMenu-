from typing import Literal
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.services.restaurant_service import RestaurantService
from app.services.qr_service import QrService


router = APIRouter(prefix="/api/v1/admin/qr", tags=["qr"])


@router.get("")
async def get_qr(
    output_format: Literal["png", "svg"] = Query(default="png", alias="format"),
    size: Literal["sm", "md", "lg", "xl"] = Query(default="md"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurante no encontrado")

    menu_url = QrService.build_menu_url(restaurant.slug)
    qr_bytes, media_type = QrService.generate_qr(menu_url, output_format=output_format, size=size)

    ext = "svg" if output_format == "svg" else "png"
    filename = f"menu-{restaurant.slug}-{size}.{ext}"
    return Response(
        content=qr_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )
