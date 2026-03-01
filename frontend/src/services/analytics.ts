import { API_BASE_URL } from '../config/api'
import { apiRequest } from './http'
import type { AnalyticsSummary } from '../types/analytics'

export const analyticsService = {
  getSummary(token: string) {
    return apiRequest<AnalyticsSummary>('/api/v1/admin/analytics', { token })
  },

  async exportCsv(token: string) {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/analytics/export`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('No fue posible exportar analíticas')
    }

    return response.blob()
  },

  async recordScan(slug: string) {
    try {
      await fetch(`${API_BASE_URL}/api/v1/menu/${encodeURIComponent(slug)}/scan`, {
        method: 'POST',
      })
    } catch {
      // no-op: analytics should not block menu UX
    }
  },
}