from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    DB_HOST: str
    DB_PORT: int = 5432
    JWT_SECRET_KEY: str 
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    STORAGE_PROVIDER: str = "local"
    UPLOAD_DIR: str = "uploads"
    IMAGE_MAX_SIZE_MB: int = 5
    IMAGE_WORKERS: int = 2
    PUBLIC_BASE_URL: str = "http://localhost:8000"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
    MENU_CACHE_TTL_SECONDS: int = 60
    GCS_BUCKET_NAME: str = ""
    GCS_PROJECT_ID: str = ""
    GCS_CREDENTIALS_FILE: str = ""
    GCS_PUBLIC_BASE_URL: str = "https://storage.googleapis.com"

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(',') if origin.strip()]

    class Config:
        env_file = Path(__file__).resolve().parents[3] / ".env"

settings = Settings()