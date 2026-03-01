import re
import uuid
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status, UploadFile

from app.core.config import settings
from app.models.dish import Dish
from app.services.image_worker_pool import image_worker_pool
from app.services.storage_provider import get_storage_provider


ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

VARIANTS = {
    "thumbnail": (150, 150, 80),
    "medium": (400, 400, 85),
    "large": (800, 800, 90),
}


class UploadService:
    @staticmethod
    def _slugify_filename(filename: str) -> str:
        base_name = Path(filename).stem.strip().lower()
        slug = re.sub(r"[^a-z0-9]+", "-", base_name).strip("-")
        return slug or "imagen"

    @staticmethod
    def _display_name_from_file_id(file_id: str) -> str:
        parts = file_id.split("_")
        if len(parts) >= 3:
            raw_name = "_".join(parts[2:])
            pretty_name = raw_name.replace("-", " ").replace("_", " ").strip()
            if pretty_name:
                return pretty_name.title()
        return "Imagen subida"

    @staticmethod
    async def _find_dish_name_by_file_id(db: AsyncSession, file_id: str) -> str | None:
        stmt = select(Dish.name).where(Dish.image_url.is_not(None), Dish.image_url.contains(file_id)).limit(1)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def upload_image(file: UploadFile, user_id: str | None = None) -> dict:
        if not file.content_type or file.content_type.lower() not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tipo de imagen no permitido. Use JPEG, PNG o WebP",
            )

        content = await file.read()
        max_bytes = settings.IMAGE_MAX_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El archivo excede el tamaño máximo permitido ({settings.IMAGE_MAX_SIZE_MB}MB)",
            )

        original_name = file.filename or "image"
        file_label = UploadService._slugify_filename(original_name)
        if user_id:
            user_prefix = user_id.replace("-", "")
            file_id = f"{user_prefix}_{uuid.uuid4().hex}_{file_label}"
        else:
            file_id = f"{uuid.uuid4().hex}_{file_label}"
        storage_provider = get_storage_provider()

        urls: dict[str, str] = {}

        for variant_name, (width, height, quality) in VARIANTS.items():
            image_bytes, extension = await image_worker_pool.submit(content, width, height, quality)
            filename = f"{file_id}_{variant_name}.{extension}"
            content_type = "image/webp" if extension == "webp" else "image/jpeg"
            urls[variant_name] = storage_provider.save(
                filename=filename,
                data=image_bytes,
                content_type=content_type,
            )

        return {
            "file_id": file_id,
            "original_filename": original_name,
            "urls": urls,
        }

    @staticmethod
    def delete_image(filename: str) -> dict:
        safe_filename = re.sub(r"[^a-zA-Z0-9_.-]", "", filename)
        stem = Path(safe_filename).stem
        parts = stem.split("_")
        if parts and parts[-1] in VARIANTS:
            base_id = "_".join(parts[:-1])
        else:
            base_id = stem

        if not base_id:
            base_id = stem

        storage_provider = get_storage_provider()
        deleted_files = storage_provider.delete_by_prefix(f"{base_id}_")

        return {"file_id": base_id, "deleted_files": deleted_files}

    @staticmethod
    async def list_images(db: AsyncSession, user_id: str) -> list[dict]:
        storage_provider = get_storage_provider()
        user_prefix = user_id.replace("-", "") + "_"
        grouped = storage_provider.list_images(prefix=user_prefix)

        response: list[dict] = []
        for item in grouped:
            friendly_name = UploadService._display_name_from_file_id(item["file_id"])
            if friendly_name == "Imagen subida":
                dish_name = await UploadService._find_dish_name_by_file_id(db, item["file_id"])
                if dish_name:
                    friendly_name = dish_name

            response.append(
                {
                    "file_id": item["file_id"],
                    "original_filename": friendly_name,
                    "urls": item["urls"],
                }
            )

        return response
