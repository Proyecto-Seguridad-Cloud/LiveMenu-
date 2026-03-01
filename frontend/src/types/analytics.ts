export type DailyScanCount = {
  day: string
  count: number
}

export type AnalyticsSummary = {
  total_scans: number
  scans_last_7_days: number
  scans_last_30_days: number
  daily_breakdown: DailyScanCount[]
}