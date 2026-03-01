import { API_BASE_URL } from '../config/api'
import { apiRequest } from './http'
import type { AnalyticsSummary } from '../types/analytics'

export const analyticsService = {
  getSummary(token: string) {
    return apiRequest<AnalyticsSummary>('/api/v1/admin/analytics', { token })
  },

  async recordScan(slug: string) {
    try {
      await fetch(`${API_BASE_URL}/api/v1/menu/${encodeURIComponent(slug)}/scan`, {
        method: 'POST',
      })
    } catch {
      // Silently fail — analytics should not break the menu
    }
  },
}
