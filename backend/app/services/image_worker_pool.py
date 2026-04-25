import asyncio
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass
from io import BytesIO
from typing import Optional

from PIL import Image, ImageOps

from app.core.config import settings


@dataclass
class ImageJob:
    image_bytes: bytes
    width: int
    height: int
    quality: int
    future: asyncio.Future


def _process_image_variant(image_bytes: bytes, width: int, height: int, quality: int) -> tuple[bytes, str]:
    with Image.open(BytesIO(image_bytes)) as image:
        image = ImageOps.exif_transpose(image)
        image = ImageOps.fit(image, (width, height), method=Image.Resampling.LANCZOS)

        output = BytesIO()
        try:
            image.convert("RGB").save(output, format="WEBP", quality=quality, optimize=True)
            return output.getvalue(), "webp"
        except Exception:
            output = BytesIO()
            image.convert("RGB").save(output, format="JPEG", quality=quality, optimize=True)
            return output.getvalue(), "jpg"


class ImageWorkerPool:
    def __init__(self, max_workers: int):
        self.max_workers = max_workers
        self._queue: asyncio.Queue[Optional[ImageJob]] = asyncio.Queue()
        self._workers: list[asyncio.Task] = []
        # create executor lazily to avoid expensive process spawn at import/startup
        self._executor: Optional[ProcessPoolExecutor] = None
        self._started = False

    async def start(self):
        if self._started:
            return
        self._started = True
        # create the process pool executor when actually starting
        if self._executor is None:
            self._executor = ProcessPoolExecutor(max_workers=self.max_workers)

        for _ in range(self.max_workers):
            self._workers.append(asyncio.create_task(self._worker_loop()))

    async def stop(self):
        if not self._started:
            return

        for _ in range(self.max_workers):
            await self._queue.put(None)

        await asyncio.gather(*self._workers, return_exceptions=True)
        self._workers.clear()
        self._executor.shutdown(wait=True)
        self._started = False

    async def submit(self, image_bytes: bytes, width: int, height: int, quality: int) -> tuple[bytes, str]:
        # ensure pool is started lazily on first submit
        if not self._started:
            await self.start()

        loop = asyncio.get_running_loop()
        result_future: asyncio.Future = loop.create_future()
        await self._queue.put(
            ImageJob(
                image_bytes=image_bytes,
                width=width,
                height=height,
                quality=quality,
                future=result_future,
            )
        )
        return await result_future

    async def _worker_loop(self):
        while True:
            job = await self._queue.get()
            if job is None:
                self._queue.task_done()
                break

            try:
                loop = asyncio.get_running_loop()
                processed = await loop.run_in_executor(
                    self._executor,
                    _process_image_variant,
                    job.image_bytes,
                    job.width,
                    job.height,
                    job.quality,
                )
                job.future.set_result(processed)
            except Exception as exc:
                if not job.future.done():
                    job.future.set_exception(exc)
            finally:
                self._queue.task_done()


image_worker_pool = ImageWorkerPool(max_workers=settings.IMAGE_WORKERS)
