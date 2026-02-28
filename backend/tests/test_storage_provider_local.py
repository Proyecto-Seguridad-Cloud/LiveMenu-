from app.services.storage_provider import LocalStorageProvider


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
