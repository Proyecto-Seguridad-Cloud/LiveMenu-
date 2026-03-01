import { apiRequest } from './http'
import type { PublicMenuResponse } from '../types/menu'

export const menuService = {
  getBySlug(slug: string) {
    return apiRequest<PublicMenuResponse>(`/api/v1/menu/${encodeURIComponent(slug)}`)
  },
}
