export type DailyScanCount = {
  day: string;
  count: number;
};

export type HourCount = {
  hour: number;
  count: number;
};

export type WeekdayCount = {
  weekday: number;
  label: string;
  count: number;
};

export type DeviceCount = {
  device: string;
  count: number;
};

export type ReferrerCount = {
  source: string;
  count: number;
};

export type TopItem = {
  name: string;
  count: number;
};

export type AnalyticsSummary = {
  total_scans: number;
  scans_last_7_days: number;
  scans_last_30_days: number;
  daily_breakdown: DailyScanCount[];
  // Group A
  unique_visitors: number;
  hourly_breakdown: HourCount[];
  weekday_breakdown: WeekdayCount[];
  device_breakdown: DeviceCount[];
  referrer_breakdown: ReferrerCount[];
  new_visitors: number;
  returning_visitors: number;
  // Group B
  avg_session_duration_seconds: number;
  top_categories: TopItem[];
  top_dishes: TopItem[];
  avg_scroll_depth: number;
};
