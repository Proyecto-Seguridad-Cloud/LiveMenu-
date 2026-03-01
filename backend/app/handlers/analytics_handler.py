from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.schemas.analytics import AnalyticsSummary
from app.services.analytics_service import AnalyticsService
from app.services.restaurant_service import RestaurantService

router = APIRouter(tags=["analytics"])


@router.post("/api/v1/menu/{slug}/scan", status_code=204)
async def record_scan(
    slug: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    referrer = request.headers.get("referer")
    await AnalyticsService.record_scan(
        db, slug, ip=ip, user_agent=user_agent, referrer=referrer
    )


@router.get("/api/v1/admin/analytics", response_model=AnalyticsSummary)
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurante no encontrado",
        )
    return await AnalyticsService.get_summary(db, restaurant.id)


@router.get("/api/v1/admin/analytics/export")
async def export_analytics(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    restaurant = await RestaurantService.get_by_owner(db, current_user.id)
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurante no encontrado",
        )
    csv_content = await AnalyticsService.export_csv(db, restaurant.id)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="analytics.csv"'},
    )