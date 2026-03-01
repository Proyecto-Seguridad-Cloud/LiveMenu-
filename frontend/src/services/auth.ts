import { API_BASE_URL } from '../config/api'
import type { LoginPayload, RegisterPayload, RegisterResponse, TokenResponse } from '../types/auth'

const AUTH_TOKEN_KEY = 'livemenu_token'

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  const hasJson = contentType.includes('application/json')
  const body = hasJson ? await response.json() : null

  if (!response.ok) {
    const detail = body?.detail
    if (typeof detail === 'string' && detail.trim()) {
      throw new Error(detail)
    }
    throw new Error(fallbackMessage)
  }

  return body as T
}

export const authService = {
  tokenKey: AUTH_TOKEN_KEY,

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  },

  setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  },

  clearToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  },

  async login(payload: LoginPayload): Promise<TokenResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      return await parseResponse<TokenResponse>(response, 'No fue posible iniciar sesión')
    } catch (error) {
      throw new Error(getErrorMessage(error, 'No fue posible iniciar sesión'))
    }
  },

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      return await parseResponse<RegisterResponse>(response, 'No fue posible registrar la cuenta')
    } catch (error) {
      throw new Error(getErrorMessage(error, 'No fue posible registrar la cuenta'))
    }
  },

  async logout(token: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // no-op: always clear local session client-side
    }
  },
}
