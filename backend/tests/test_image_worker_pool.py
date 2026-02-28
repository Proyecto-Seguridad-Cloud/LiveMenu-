from io import BytesIO

import pytest
from PIL import Image

from app.services.image_worker_pool import ImageWorkerPool, _process_image_variant


def build_image_bytes() -> bytes:
    image = Image.new("RGB", (300, 220), (80, 130, 200))
    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def test_process_image_variant_returns_bytes_and_extension():
    image_bytes = build_image_bytes()
    result_bytes, ext = _process_image_variant(image_bytes, 150, 150, 80)

    assert isinstance(result_bytes, bytes)
    assert len(result_bytes) > 0
    assert ext in {"webp", "jpg"}


@pytest.mark.asyncio
async def test_image_worker_pool_submit():
    pool = ImageWorkerPool(max_workers=1)
    await pool.start()

    try:
        result_bytes, ext = await pool.submit(build_image_bytes(), 100, 100, 80)
        assert isinstance(result_bytes, bytes)
        assert len(result_bytes) > 0
        assert ext in {"webp", "jpg"}
    finally:
        await pool.stop()
