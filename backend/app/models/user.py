import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, func
from typing import Optional, TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.restaurant import Restaurant

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    restaurant: Mapped[Optional["Restaurant"]] = relationship(
        "Restaurant",
        back_populates="owner",
        uselist=False,
    )