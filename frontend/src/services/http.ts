import { API_BASE_URL } from '../config/api'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  token?: string
  body?: unknown
}

type FormRequestOptions = {
  method?: 'POST' | 'PUT' | 'PATCH'
  token?: string
  formData: FormData
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', token, body } = options

  const headers: HeadersInit = {
    Accept: 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const contentType = response.headers.get('content-type') || ''
  const hasJson = contentType.includes('application/json')
  const payload = hasJson ? await response.json() : null

  if (!response.ok) {
    const detail = payload && typeof payload.detail === 'string' ? payload.detail : 'Error inesperado del servidor'
    throw new ApiError(response.status, detail)
  }

  return payload as T
}

export async function apiFormRequest<T>(path: string, options: FormRequestOptions): Promise<T> {
  const { method = 'POST', token, formData } = options

  const headers: HeadersInit = {
    Accept: 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: formData,
  })

  const contentType = response.headers.get('content-type') || ''
  const hasJson = contentType.includes('application/json')
  const payload = hasJson ? await response.json() : null

  if (!response.ok) {
    const detail = payload && typeof payload.detail === 'string' ? payload.detail : 'Error inesperado del servidor'
    throw new ApiError(response.status, detail)
  }

  return payload as T
}
