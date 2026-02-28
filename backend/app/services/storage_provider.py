from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, status
from google.cloud import storage

from app.core.config import settings


class StorageProvider(ABC):
    @abstractmethod
    def save(self, filename: str, data: bytes, content_type: str) -> str:
        raise NotImplementedError

    @abstractmethod
    def delete_by_prefix(self, prefix: str) -> int:
        raise NotImplementedError


class LocalStorageProvider(StorageProvider):
    def __init__(self, upload_dir: str, public_base_url: str):
        self.upload_dir = Path(upload_dir)
        self.public_base_url = public_base_url.rstrip("/")
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def save(self, filename: str, data: bytes, content_type: str) -> str:
        _ = content_type
        path = self.upload_dir / filename
        path.write_bytes(data)
        return f"{self.public_base_url}/uploads/{filename}"

    def delete_by_prefix(self, prefix: str) -> int:
        deleted = 0
        if not self.upload_dir.exists():
            return deleted

        for file_path in self.upload_dir.glob(f"{prefix}*"):
            if file_path.is_file():
                file_path.unlink(missing_ok=True)
                deleted += 1
        return deleted


class GCSStorageProvider(StorageProvider):
    def __init__(
        self,
        bucket_name: str,
        project_id: str = "",
        credentials_file: str = "",
        public_base_url: str = "https://storage.googleapis.com",
    ):
        if not bucket_name:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GCS_BUCKET_NAME no está configurado",
            )

        self.bucket_name = bucket_name
        self.public_base_url = public_base_url.rstrip("/")

        if credentials_file:
            self.client = storage.Client.from_service_account_json(
                credentials_file,
                project=project_id or None,
            )
        else:
            self.client = storage.Client(project=project_id or None)

        self.bucket = self.client.bucket(bucket_name)

    def save(self, filename: str, data: bytes, content_type: str) -> str:
        blob = self.bucket.blob(filename)
        blob.upload_from_string(data, content_type=content_type)
        return f"{self.public_base_url}/{self.bucket_name}/{filename}"

    def delete_by_prefix(self, prefix: str) -> int:
        deleted = 0
        blobs = self.client.list_blobs(self.bucket_name, prefix=prefix)
        for blob in blobs:
            blob.delete()
            deleted += 1
        return deleted


_provider_instance: Optional[StorageProvider] = None


def get_storage_provider() -> StorageProvider:
    global _provider_instance
    if _provider_instance is not None:
        return _provider_instance

    provider = settings.STORAGE_PROVIDER.strip().lower()
    if provider == "gcs":
        _provider_instance = GCSStorageProvider(
            bucket_name=settings.GCS_BUCKET_NAME,
            project_id=settings.GCS_PROJECT_ID,
            credentials_file=settings.GCS_CREDENTIALS_FILE,
            public_base_url=settings.GCS_PUBLIC_BASE_URL,
        )
    else:
        _provider_instance = LocalStorageProvider(
            upload_dir=settings.UPLOAD_DIR,
            public_base_url=settings.PUBLIC_BASE_URL,
        )

    return _provider_instance
