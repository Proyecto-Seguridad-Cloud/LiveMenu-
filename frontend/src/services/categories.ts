import { apiRequest } from './http'
import type { Category, CategoryPayload, CategoryUpdatePayload } from '../types/category'

export const categoriesService = {
  list(token: string) {
    return apiRequest<Category[]>('/api/v1/admin/categories', { token })
  },

  create(token: string, payload: CategoryPayload) {
    return apiRequest<Category>('/api/v1/admin/categories', {
      method: 'POST',
      token,
      body: payload,
    })
  },

  update(token: string, categoryId: string, payload: CategoryUpdatePayload) {
    return apiRequest<Category>(`/api/v1/admin/categories/${categoryId}`, {
      method: 'PUT',
      token,
      body: payload,
    })
  },

  remove(token: string, categoryId: string) {
    return apiRequest<void>(`/api/v1/admin/categories/${categoryId}`, {
      method: 'DELETE',
      token,
    })
  },

  reorder(token: string, ids: string[]) {
    return apiRequest<Category[]>('/api/v1/admin/categories/reorder', {
      method: 'PATCH',
      token,
      body: { ids },
    })
  },
}
