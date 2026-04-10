// apps/web/src/app/admin/reportes/analytics-client.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PeriodToggle, type GroupBy } from '@/components/period-toggle';
import { RevenueLineChart } from '@/components/revenue-line-chart';
import { StackedServicesChart } from '@/components/stacked-services-chart';
import { ServiceBreakdownTable } from '@/components/service-breakdown-table';

interface SeriesPoint {
  period: string;
  periodLabel: string;
  revenue: number;
  units: number;
  byService: Record<string, { units: number; revenue: number }>;
}

interface TopService {
  serviceId: string;
  serviceName: string;
  units: number;
  revenue: number;
  avgTicket: number;
  pctOfUnits: number;
}

interface Analytics {
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

function defaultGroupBy(days: number): GroupBy {
  if (days <= 30) return 'day';
  if (days <= 90) return 'week';
  return 'month';
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export function AnalyticsDashboard({ carWashId }: { carWashId: string }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState<number | 'custom'>(30);
  const [fromDate, setFromDate] = useState<string>(daysAgoStr(30));
  const [toDate, setToDate] = useState<string>(todayStr());
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [userOverrodeGroupBy, setUserOverrodeGroupBy] = useState(false);
  const [loading, setLoading] = useState(true);

  // When range preset changes, sync fromDate/toDate and auto-adjust groupBy
  useEffect(() => {
    if (days === 'custom') return;
    setFromDate(daysAgoStr(days));
    setToDate(todayStr());
    if (!userOverrodeGroupBy) {
      setGroupBy(defaultGroupBy(days));
    }
  }, [days, userOverrodeGroupBy]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      car_wash_id: carWashId,
      from: fromDate,
      to: toDate,
      group_by: groupBy,
    });
    fetch(`/api/admin/analytics?${params}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [carWashId, fromDate, toDate, groupBy]);

  const handleGroupByChange = (gb: GroupBy) => {
    setGroupBy(gb);
    setUserOverrodeGroupBy(true);
  };

  const sortedServices = useMemo(
    () => (data ? Object.entries(data.byService).sort((a, b) => b[1].revenue - a[1].revenue) : []),
    [data]
  );
  const sortedHours = useMemo(
    () =>
      data
        ? Object.entries(data.byHour).sort((a, b) => b[1] - a[1]).slice(0, 8)
        : [],
    [data]
  );
  const maxHourCount = Math.max(...sortedHours.map(([, v]) => v), 1);

  if (loading && !data) {
    return <div className="text-center py-12 text-muted-foreground">Cargando analiticas...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">Error al cargar datos</div>;
  }

  return (
    <div>
      {/* Controls row */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Agrupar:</span>
          <PeriodToggle value={groupBy} onChange={handleGroupByChange} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Rango:</span>
          <div className="flex flex-wrap gap-2">
            {[7, 14, 30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors ${
                  days === d
                    ? 'bg-primary text-white'
                    : 'bg-white border border-border text-foreground hover:border-primary/50'
                }`}
              >
                {d} dias
              </button>
            ))}
            <button
              onClick={() => setDays('custom')}
              className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors ${
                days === 'custom'
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border text-foreground hover:border-primary/50'
              }`}
            >
              Personalizado
            </button>
          </div>
        </div>
        {days === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-input border border-border px-2 py-1"
            />
            <span>a</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-input border border-border px-2 py-1"
            />
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-modal border border-border p-4">
          <div className="text-xs text-muted-foreground font-semibold uppercase">Citas totales</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">{data.totalAppointments}</div>
          <div className="text-xs text-accent mt-0.5">{data.completedCount} completadas</div>
        </div>
        <div className="bg-white rounded-modal border border-border p-4">
          <div className="text-xs text-muted-foreground font-semibold uppercase">Ingresos</div>
          <div className="text-2xl font-extrabold text-accent mt-1">
            ${Number(data.totalRevenue).toLocaleString('es-MX')}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">MXN</div>
        </div>
        <div className="bg-white rounded-modal border border-border p-4">
          <div className="text-xs text-muted-foreground font-semibold uppercase">Tasa cancelacion</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">{data.cancelRate}%</div>
          <div className="text-xs text-muted-foreground mt-0.5">{data.cancelledCount} canceladas</div>
        </div>
        <div className="bg-white rounded-modal border border-border p-4">
          <div className="text-xs text-muted-foreground font-semibold uppercase">Clientes unicos</div>
          <div className="text-2xl font-extrabold text-foreground mt-1">{data.uniqueClients}</div>
          <div className="text-xs text-muted-foreground mt-0.5">en el rango</div>
        </div>
      </div>

      {/* Revenue over time */}
      <div className="bg-white rounded-modal border border-border p-5 mb-6">
        <h3 className="text-sm font-bold text-foreground mb-4">Ingresos en el tiempo</h3>
        <RevenueLineChart series={data.series} />
      </div>

      {/* Stacked services */}
      <div className="bg-white rounded-modal border border-border p-5 mb-6">
        <h3 className="text-sm font-bold text-foreground mb-4">Unidades lavadas por servicio</h3>
        <StackedServicesChart series={data.series} />
      </div>

      {/* Service breakdown table */}
      <div className="mb-6">
        <ServiceBreakdownTable services={data.topServices} />
      </div>

      {/* Existing charts preserved */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-modal border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Ingresos por servicio</h3>
          {sortedServices.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {sortedServices.map(([name, info]) => {
                const maxRev = sortedServices[0]?.[1]?.revenue || 1;
                const pct = (info.revenue / maxRev) * 100;
                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-foreground">{name}</span>
                      <span className="text-muted-foreground">
                        {info.count} citas · ${Number(info.revenue).toLocaleString('es-MX')}
                      </span>
                    </div>
                    <div className="bg-muted rounded-pill h-2.5">
                      <div className="bg-accent rounded-pill h-2.5 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-modal border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Horarios mas populares</h3>
          {sortedHours.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {sortedHours.map(([hour, count]) => {
                const pct = (count / maxHourCount) * 100;
                return (
                  <div key={hour} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-foreground w-12">{hour}</span>
                    <div className="flex-1 bg-muted rounded-pill h-5">
                      <div
                        className="bg-primary rounded-pill h-5 flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${Math.max(pct, 10)}%` }}
                      >
                        <span className="text-[9px] font-bold text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
