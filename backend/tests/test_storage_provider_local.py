from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from app.services import storage_provider
from app.services.storage_provider import GCSStorageProvider, LocalStorageProvider


def test_local_storage_save_and_delete_by_prefix(tmp_path):
    provider = LocalStorageProvider(upload_dir=str(tmp_path), public_base_url="http://localhost:8000")

    url = provider.save("abc_thumbnail.webp", b"image-bytes", "image/webp")
    assert url == "http://localhost:8000/uploads/abc_thumbnail.webp"
    assert (tmp_path / "abc_thumbnail.webp").exists()

    provider.save("abc_medium.webp", b"image-bytes", "image/webp")
    provider.save("other_file.webp", b"image-bytes", "image/webp")

    deleted = provider.delete_by_prefix("abc_")
    assert deleted == 2
    assert not (tmp_path / "abc_thumbnail.webp").exists()
    assert not (tmp_path / "abc_medium.webp").exists()
    assert (tmp_path / "other_file.webp").exists()


def test_local_storage_delete_nonexistent_dir(tmp_path):
    missing_dir = tmp_path / "missing-uploads"
    provider = LocalStorageProvider(upload_dir=str(missing_dir), public_base_url="http://localhost:8000")
    missing_dir.rmdir()

    deleted = provider.delete_by_prefix("abc_")
    assert deleted == 0


def test_local_storage_list_images_sorted_and_filtered(tmp_path):
    provider = LocalStorageProvider(upload_dir=str(tmp_path), public_base_url="http://localhost:8000")

    old_file = tmp_path / "usera_itemold_thumbnail.webp"
    old_file.write_bytes(b"old")
    old_time = datetime.now(timezone.utc) - timedelta(minutes=10)
    old_epoch = old_time.timestamp()

    new_file = tmp_path / "usera_itemnew_medium.webp"
    new_file.write_bytes(b"new")
    new_time = datetime.now(timezone.utc)
    new_epoch = new_time.timestamp()

    ignored_file = tmp_path / "without_underscore"
    ignored_file.write_bytes(b"x")

    import os
    os.utime(old_file, (old_epoch, old_epoch))
    os.utime(new_file, (new_epoch, new_epoch))

    result = provider.list_images(prefix="usera_")

    assert len(result) == 2
    assert result[0]["file_id"] == "usera_itemnew"
    assert result[1]["file_id"] == "usera_itemold"
    assert "medium" in result[0]["urls"]
    assert "thumbnail" in result[1]["urls"]


def test_local_storage_list_images_empty_when_dir_missing(tmp_path):
    missing_dir = tmp_path / "missing-list-dir"
    provider = LocalStorageProvider(upload_dir=str(missing_dir), public_base_url="http://localhost:8000")
    missing_dir.rmdir()

    assert provider.list_images() == []


class FakeBlob:
    def __init__(self, name: str, updated=None):
        self.name = name
        self.updated = updated
        self.deleted = False
        self.uploaded = None

    def upload_from_string(self, data: bytes, content_type: str):
        self.uploaded = (data, content_type)

    def delete(self):
        self.deleted = True


class FakeBucket:
    def __init__(self):
        self.blobs = {}

    def blob(self, filename: str):
        blob = self.blobs.get(filename)
        if blob is None:
            blob = FakeBlob(filename)
            self.blobs[filename] = blob
        return blob


class FakeStorageClient:
    def __init__(self):
        self.fake_bucket = FakeBucket()
        self.listing = []
        self.list_calls = []

    def bucket(self, bucket_name: str):
        _ = bucket_name
        return self.fake_bucket

    def list_blobs(self, bucket_name: str, prefix: str | None = None):
        self.list_calls.append((bucket_name, prefix))
        if prefix:
            return [blob for blob in self.listing if blob.name.startswith(prefix)]
        return list(self.listing)


def test_gcs_provider_requires_bucket_name():
    with pytest.raises(HTTPException) as exc:
        GCSStorageProvider(bucket_name="")
    assert exc.value.status_code == 500


def test_gcs_provider_with_credentials_uses_service_account(monkeypatch):
    fake_client = FakeStorageClient()

    class FakeClientFactory:
        @staticmethod
        def from_service_account_json(credentials_file, project=None):
            assert credentials_file == "/tmp/key.json"
            assert project == "proj"
            return fake_client

    monkeypatch.setattr(storage_provider.storage, "Client", FakeClientFactory)

    provider = GCSStorageProvider(
        bucket_name="my-bucket",
        project_id="proj",
        credentials_file="/tmp/key.json",
        public_base_url="https://storage.googleapis.com/",
    )

    url = provider.save("file.webp", b"img", "image/webp")
    assert url == "https://storage.googleapis.com/my-bucket/file.webp"


def test_gcs_provider_without_credentials(monkeypatch):
    fake_client = FakeStorageClient()

    class FakeClientFactory:
        def __init__(self, project=None):
            assert project == "proj"
            self._client = fake_client

        def bucket(self, bucket_name: str):
            return self._client.bucket(bucket_name)

        def list_blobs(self, bucket_name: str, prefix: str | None = None):
            return self._client.list_blobs(bucket_name, prefix)

    monkeypatch.setattr(storage_provider.storage, "Client", FakeClientFactory)

    provider = GCSStorageProvider(bucket_name="my-bucket", project_id="proj")

    fake_client.listing = [
        FakeBlob("abc_old_thumbnail.webp", datetime.now(timezone.utc) - timedelta(minutes=5)),
        FakeBlob("abc_new_medium.webp", datetime.now(timezone.utc)),
        FakeBlob("folder/"),
        FakeBlob("no_underscore"),
        FakeBlob("abc_new_large.webp", None),
    ]

    deleted = provider.delete_by_prefix("abc_new_")
    assert deleted == 2

    listed = provider.list_images(prefix="abc_")
    assert len(listed) == 2
    assert listed[0]["file_id"] in {"abc_new", "abc_old"}
    assert all(item["file_id"].startswith("abc_") for item in listed)


def test_get_storage_provider_local_and_cache(monkeypatch):
    monkeypatch.setattr(storage_provider.settings, "STORAGE_PROVIDER", "local")
    monkeypatch.setattr(storage_provider.settings, "UPLOAD_DIR", "uploads")
    monkeypatch.setattr(storage_provider.settings, "PUBLIC_BASE_URL", "http://localhost:8000")
    storage_provider._provider_instance = None

    provider1 = storage_provider.get_storage_provider()
    provider2 = storage_provider.get_storage_provider()

    assert isinstance(provider1, LocalStorageProvider)
    assert provider1 is provider2

    storage_provider._provider_instance = None


def test_get_storage_provider_gcs(monkeypatch):
    fake_client = FakeStorageClient()

    class FakeClientFactory:
        def __init__(self, project=None):
            _ = project
            self._client = fake_client

        def bucket(self, bucket_name: str):
            return self._client.bucket(bucket_name)

        def list_blobs(self, bucket_name: str, prefix: str | None = None):
            return self._client.list_blobs(bucket_name, prefix)

    monkeypatch.setattr(storage_provider.storage, "Client", FakeClientFactory)
    monkeypatch.setattr(storage_provider.settings, "STORAGE_PROVIDER", "gcs")
    monkeypatch.setattr(storage_provider.settings, "GCS_BUCKET_NAME", "bucket")
    monkeypatch.setattr(storage_provider.settings, "GCS_PROJECT_ID", "proj")
    monkeypatch.setattr(storage_provider.settings, "GCS_CREDENTIALS_FILE", "")
    monkeypatch.setattr(storage_provider.settings, "GCS_PUBLIC_BASE_URL", "https://storage.googleapis.com")
    storage_provider._provider_instance = None

    provider = storage_provider.get_storage_provider()

    assert isinstance(provider, GCSStorageProvider)
    storage_provider._provider_instance = None
