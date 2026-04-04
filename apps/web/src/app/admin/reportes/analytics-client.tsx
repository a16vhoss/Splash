'use client';

import { useState, useEffect } from 'react';

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
}

export function AnalyticsDashboard({ carWashId }: { carWashId: string }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?car_wash_id=${carWashId}&days=${days}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [carWashId, days]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Cargando analiticas...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">Error al cargar datos</div>;
  }

  const sortedServices = Object.entries(data.byService).sort((a, b) => b[1].revenue - a[1].revenue);
  const sortedHours = Object.entries(data.byHour).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxHourCount = Math.max(...sortedHours.map(([, v]) => v), 1);

  return (
    <div>
      {/* Period selector */}
      <div className="flex gap-2 mb-6">
        {[7, 14, 30, 60, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors ${
              days === d ? 'bg-primary text-white' : 'bg-white border border-border text-foreground hover:border-primary/50'
            }`}
          >
            {d} dias
          </button>
        ))}
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
          <div className="text-2xl font-extrabold text-accent mt-1">${Number(data.totalRevenue).toLocaleString('es-MX')}</div>
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
          <div className="text-xs text-muted-foreground mt-0.5">en {days} dias</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Service */}
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
                      <span className="text-muted-foreground">{info.count} citas · ${Number(info.revenue).toLocaleString('es-MX')}</span>
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

        {/* Popular Hours */}
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
                      <div className="bg-primary rounded-pill h-5 flex items-center justify-end pr-2 transition-all" style={{ width: `${Math.max(pct, 10)}%` }}>
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
