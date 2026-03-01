import { apiFormRequest, apiRequest } from './http'
import type { DeleteUploadResponse, UploadImageResponse } from '../types/upload'

export const uploadsService = {
  uploadImage(token: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return apiFormRequest<UploadImageResponse>('/api/v1/admin/upload', {
      method: 'POST',
      token,
      formData,
    })
  },

  deleteImage(token: string, fileIdOrFilename: string) {
    return apiRequest<DeleteUploadResponse>(`/api/v1/admin/upload/${encodeURIComponent(fileIdOrFilename)}`, {
      method: 'DELETE',
      token,
    })
  },
}
