// apps/web/src/lib/exports/types.ts

/**
 * Metadata about a report export (car wash, date range, grouping, generation time).
 * Used by both the Excel and PDF exporters for headers and filenames.
 */
export interface ExportMeta {
  carWashName: string;
  fromDate: string;  // YYYY-MM-DD
  toDate: string;    // YYYY-MM-DD
  groupBy: 'day' | 'week' | 'month';
  generatedAt: Date;
}

/**
 * Analytics response shape returned by GET /api/admin/analytics.
 * Mirrors the existing interface in analytics-client.tsx.
 */
export interface SeriesPoint {
  period: string;
  periodLabel: string;
  revenue: number;
  units: number;
  byService: Record<string, { units: number; revenue: number }>;
}

export interface TopService {
  serviceId: string;
  serviceName: string;
  units: number;
  revenue: number;
  avgTicket: number;
  pctOfUnits: number;
}

export interface Analytics {
  totalAppointments: number;
  completedCount: number;
  cancelledCount: number;
  totalRevenue: number;
  cancelRate: number;
  uniqueClients: number;
  byDay: Record<string, number>;
  revenueByDay: Record<string, number>;
  byService: Record<string, { count: number; revenue: number }>;
  byHour: Record<string, number>;
  series: SeriesPoint[];
  topServices: TopService[];
}
