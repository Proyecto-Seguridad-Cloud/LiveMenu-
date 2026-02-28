import pytest
from fastapi import HTTPException

from app.services import upload_service
from app.services.upload_service import UploadService


class FakeUploadFile:
    def __init__(self, filename: str, content_type: str, content: bytes):
        self.filename = filename
        self.content_type = content_type
        self._content = content

    async def read(self) -> bytes:
        return self._content


class FakeStorageProvider:
    def __init__(self):
        self.saved = []
        self.deleted_prefixes = []

    def save(self, filename: str, data: bytes, content_type: str) -> str:
        self.saved.append((filename, data, content_type))
        return f"https://fake-storage/{filename}"

    def delete_by_prefix(self, prefix: str) -> int:
        self.deleted_prefixes.append(prefix)
        return 3


@pytest.mark.asyncio
async def test_upload_image_success(monkeypatch):
    fake_provider = FakeStorageProvider()

    async def fake_submit(image_bytes, width, height, quality):
        _ = image_bytes
        return b"processed", "webp"

    monkeypatch.setattr(upload_service, "get_storage_provider", lambda: fake_provider)
    monkeypatch.setattr(upload_service.image_worker_pool, "submit", fake_submit)

    file = FakeUploadFile("photo.png", "image/png", b"raw-image")

    result = await UploadService.upload_image(file)

    assert result["original_filename"] == "photo.png"
    assert set(result["urls"].keys()) == {"thumbnail", "medium", "large"}
    assert len(fake_provider.saved) == 3
    assert all(item[2] == "image/webp" for item in fake_provider.saved)


@pytest.mark.asyncio
async def test_upload_image_rejects_invalid_type():
    file = FakeUploadFile("doc.pdf", "application/pdf", b"pdf")

    with pytest.raises(HTTPException) as exc:
        await UploadService.upload_image(file)

    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_upload_image_rejects_oversized_file(monkeypatch):
    monkeypatch.setattr(upload_service.settings, "IMAGE_MAX_SIZE_MB", 1)
    file = FakeUploadFile("photo.png", "image/png", b"a" * (2 * 1024 * 1024))

    with pytest.raises(HTTPException) as exc:
        await UploadService.upload_image(file)

    assert exc.value.status_code == 400


def test_delete_image_uses_prefix(monkeypatch):
    fake_provider = FakeStorageProvider()
    monkeypatch.setattr(upload_service, "get_storage_provider", lambda: fake_provider)

    result = UploadService.delete_image("abc123_thumbnail.webp")

    assert result["file_id"] == "abc123"
    assert result["deleted_files"] == 3
    assert fake_provider.deleted_prefixes == ["abc123_"]
