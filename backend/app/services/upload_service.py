import re
import uuid
from pathlib import Path
from fastapi import HTTPException, status, UploadFile

from app.core.config import settings
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
    async def upload_image(file: UploadFile) -> dict:
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

        file_id = uuid.uuid4().hex
        storage_provider = get_storage_provider()

        urls: dict[str, str] = {}
        original_name = file.filename or "image"

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
        base_id = Path(safe_filename).stem.split("_")[0]

        storage_provider = get_storage_provider()
        deleted_files = storage_provider.delete_by_prefix(f"{base_id}_")

        return {"file_id": base_id, "deleted_files": deleted_files}
