from pydantic import BaseModel


class UploadImageResponse(BaseModel):
    file_id: str
    original_filename: str
    urls: dict[str, str]


class DeleteUploadResponse(BaseModel):
    file_id: str
    deleted_files: int
