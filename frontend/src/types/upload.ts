export type UploadImageResponse = {
  file_id: string
  original_filename: string
  urls: Record<string, string>
}

export type DeleteUploadResponse = {
  file_id: string
  deleted_files: number
}
