from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.handlers.auth_handler import router as auth_router
from app.handlers.restaurant_handler import router as restaurant_router
from app.handlers.category_handler import router as category_router
from app.handlers.dish_handler import router as dish_router
from app.handlers.upload_handler import router as upload_router
from app.services.image_worker_pool import image_worker_pool

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="LiveMenu API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth_router)
app.include_router(restaurant_router)
app.include_router(category_router)
app.include_router(dish_router)
app.include_router(upload_router)

Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.on_event("startup")
async def startup_event():
    await image_worker_pool.start()


@app.on_event("shutdown")
async def shutdown_event():
    await image_worker_pool.stop()

@app.get("/health")
async def health():
    return {"status": "ok"}