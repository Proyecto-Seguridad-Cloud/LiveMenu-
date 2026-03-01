import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ScanEvent(Base):
    __tablename__ = "scan_events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("restaurants.id"), nullable=False, index=True
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    referrer: Mapped[str | None] = mapped_column(String(1024), nullable=True)
