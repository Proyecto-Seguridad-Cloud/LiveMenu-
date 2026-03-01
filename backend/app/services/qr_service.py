import io
from fastapi import HTTPException, status
import qrcode
from qrcode.image.svg import SvgImage

from app.core.config import settings


QR_SIZE_MAP = {
    "sm": 4,
    "md": 6,
    "lg": 8,
    "xl": 10,
}


class QrService:
    @staticmethod
    def build_menu_url(slug: str) -> str:
        base = settings.PUBLIC_BASE_URL.rstrip("/")
        return f"{base}/m/{slug}"

    @staticmethod
    def generate_qr(menu_url: str, output_format: str = "png", size: str = "md") -> tuple[bytes, str]:
        box_size = QR_SIZE_MAP.get(size)
        if not box_size:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tamaño de QR inválido")

        if output_format not in {"png", "svg"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Formato de QR inválido")

        if output_format == "svg":
            image = qrcode.make(menu_url, image_factory=SvgImage, box_size=box_size, border=4)
            buffer = io.BytesIO()
            image.save(buffer)
            return buffer.getvalue(), "image/svg+xml"

        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=box_size,
            border=4,
        )
        qr.add_data(menu_url)
        qr.make(fit=True)
        image = qr.make_image(fill_color="black", back_color="white")

        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return buffer.getvalue(), "image/png"
