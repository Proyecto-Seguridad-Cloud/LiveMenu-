from fastapi import APIRouter, Depends, File, UploadFile
from app.core.security import get_current_user
from app.db.session import get_db
from app.schemas import UploadImageResponse, DeleteUploadResponse
from app.services.upload_service import UploadService
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/v1/admin/upload", tags=["upload"])


@router.post("", response_model=UploadImageResponse)
async def upload_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    result = await UploadService.upload_image(file, str(current_user.id))
    return result


@router.get("", response_model=list[UploadImageResponse])
async def list_images(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await UploadService.list_images(db, str(current_user.id))
    return result


@router.delete("/{filename}", response_model=DeleteUploadResponse)
async def delete_image(
    filename: str,
    current_user=Depends(get_current_user),
):
    _ = current_user
    result = UploadService.delete_image(filename)
    return result
