import { apiRequest } from './http'
import type { Dish, DishPayload, DishUpdatePayload } from '../types/dish'

type DishFilters = {
  categoryId?: string
  available?: 'all' | 'true' | 'false'
}

function buildDishListPath(filters: DishFilters = {}): string {
  const params = new URLSearchParams()

  if (filters.categoryId) {
    params.set('category_id', filters.categoryId)
  }

  if (filters.available === 'true') {
    params.set('available', 'true')
  }

  if (filters.available === 'false') {
    params.set('available', 'false')
  }

  const query = params.toString()
  return query ? `/api/v1/admin/dishes?${query}` : '/api/v1/admin/dishes'
}

export const dishesService = {
  list(token: string, filters: DishFilters = {}) {
    return apiRequest<Dish[]>(buildDishListPath(filters), { token })
  },

  get(token: string, dishId: string) {
    return apiRequest<Dish>(`/api/v1/admin/dishes/${dishId}`, { token })
  },

  create(token: string, payload: DishPayload) {
    return apiRequest<Dish>('/api/v1/admin/dishes', {
      method: 'POST',
      token,
      body: payload,
    })
  },

  update(token: string, dishId: string, payload: DishUpdatePayload) {
    return apiRequest<Dish>(`/api/v1/admin/dishes/${dishId}`, {
      method: 'PUT',
      token,
      body: payload,
    })
  },

  remove(token: string, dishId: string) {
    return apiRequest<void>(`/api/v1/admin/dishes/${dishId}`, {
      method: 'DELETE',
      token,
    })
  },

  updateAvailability(token: string, dishId: string, available: boolean) {
    return apiRequest<Dish>(`/api/v1/admin/dishes/${dishId}/availability`, {
      method: 'PATCH',
      token,
      body: { available },
    })
  },
}
