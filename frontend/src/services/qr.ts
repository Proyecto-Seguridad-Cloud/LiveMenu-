import { API_BASE_URL } from '../config/api'

export type QrFormat = 'png' | 'svg'
export type QrSize = 'sm' | 'md' | 'lg' | 'xl'

export async function fetchQrBlob(token: string, format: QrFormat, size: QrSize): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/qr?format=${format}&size=${size}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    let message = 'No fue posible generar el código QR'
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const payload = await response.json()
      if (payload && typeof payload.detail === 'string') {
        message = payload.detail
      }
    }

    throw new Error(message)
  }

  return response.blob()
}
