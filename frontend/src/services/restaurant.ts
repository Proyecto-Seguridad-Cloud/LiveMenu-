import { apiRequest } from './http'
import type { Restaurant, RestaurantPayload } from '../types/restaurant'

export const restaurantService = {
  getCurrent(token: string) {
    return apiRequest<Restaurant>('/api/v1/admin/restaurant', { token })
  },

  create(token: string, payload: RestaurantPayload) {
    return apiRequest<Restaurant>('/api/v1/admin/restaurant', {
      method: 'POST',
      token,
      body: payload,
    })
  },

  update(token: string, payload: RestaurantPayload) {
    return apiRequest<Restaurant>('/api/v1/admin/restaurant', {
      method: 'PUT',
      token,
      body: payload,
    })
  },
}
