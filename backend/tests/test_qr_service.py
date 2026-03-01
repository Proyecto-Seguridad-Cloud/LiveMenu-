import pytest
from fastapi import HTTPException

from app.services.qr_service import QrService


def test_build_menu_url_uses_public_base(monkeypatch):
    monkeypatch.setattr("app.services.qr_service.settings.PUBLIC_BASE_URL", "http://localhost:8000")

    result = QrService.build_menu_url("rest-slug")

    assert result == "http://localhost:8000/m/rest-slug"


def test_generate_qr_png_success():
    payload, media_type = QrService.generate_qr("http://localhost:8000/m/demo", output_format="png", size="md")

    assert media_type == "image/png"
    assert isinstance(payload, bytes)
    assert len(payload) > 0


def test_generate_qr_svg_success():
    payload, media_type = QrService.generate_qr("http://localhost:8000/m/demo", output_format="svg", size="lg")

    assert media_type == "image/svg+xml"
    assert isinstance(payload, bytes)
    assert payload.startswith(b"<?xml")


def test_generate_qr_raises_invalid_format():
    with pytest.raises(HTTPException) as exc:
        QrService.generate_qr("http://localhost:8000/m/demo", output_format="gif", size="md")

    assert exc.value.status_code == 400


def test_generate_qr_raises_invalid_size():
    with pytest.raises(HTTPException) as exc:
        QrService.generate_qr("http://localhost:8000/m/demo", output_format="png", size="xxl")

    assert exc.value.status_code == 400
