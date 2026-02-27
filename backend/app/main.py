from fastapi import FastAPI
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.handlers.auth_handler import router as auth_router
from app.handlers.restaurant_handler import router as restaurant_router
from app.handlers.category_handler import router as category_router

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="LiveMenu API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth_router)
app.include_router(restaurant_router)
app.include_router(category_router)

@app.get("/health")
async def health():
    return {"status": "ok"}