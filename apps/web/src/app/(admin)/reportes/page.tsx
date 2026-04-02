import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { MetricCard } from '@/components/metric-card';
import { RevenueChart } from '@/components/revenue-chart';
import { RatingSummary } from '@/components/rating-summary';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS = [
  { label: 'Hoy', value: 'hoy' },
  { label: 'Semana', value: 'semana' },
  { label: 'Mes', value: 'mes' },
  { label: '6 Meses', value: '6meses' },
  { label: 'Ano', value: 'ano' },
];

function getPeriodRange(periodo: string): { from: string; to: string } {
  const now = new Date();
  const toStr = now.toISOString().split('T')[0];

  let from = new Date();
  switch (periodo) {
    case 'hoy':
      from = new Date(now);
      break;
    case 'semana':
      from = new Date(now);
      from.setDate(from.getDate() - 6);
      break;
    case '6meses':
      from = new Date(now);
      from.setMonth(from.getMonth() - 6);
      break;
    case 'ano':
      from = new Date(now);
      from.setFullYear(from.getFullYear() - 1);
      break;
    case 'mes':
    default:
      from = new Date(now);
      from.setDate(from.getDate() - 29);
      break;
  }

  return { from: from.toISOString().split('T')[0], to: toStr };
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo = 'mes' } = await searchParams;
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id, rating_promedio, total_reviews')
    .eq('owner_id', user.id)
    .single() as { data: any };

  const { from, to } = getPeriodRange(periodo);

  let completedApts: any[] = [];
  let allApts: any[] = [];
  let reviews: any[] = [];

  if (carWash) {
    const { data: ca } = await supabase
      .from('appointments')
      .select('id, fecha, precio_cobrado, service_id, services!service_id(nombre)')
      .eq('car_wash_id', carWash.id)
      .eq('estado', 'completed')
      .gte('fecha', from)
      .lte('fecha', to) as { data: any[] | null };
    completedApts = ca ?? [];

    const { data: aa } = await supabase
      .from('appointments')
      .select('id')
      .eq('car_wash_id', carWash.id)
      .gte('fecha', from)
      .lte('fecha', to) as { data: any[] | null };
    allApts = aa ?? [];

    const { data: rv } = await supabase
      .from('reviews')
      .select('calificacion')
      .eq('car_wash_id', carWash.id)
      .gte('created_at', from)
      .lte('created_at', to + 'T23:59:59') as { data: any[] | null };
    reviews = rv ?? [];
  }

  // Aggregate metrics
  const totalRevenue = completedApts.reduce((s: number, a: any) => s + (a.precio_cobrado ?? 0), 0);
  const totalCitas = allApts.length;
  const ticketPromedio = completedApts.length > 0 ? totalRevenue / completedApts.length : 0;

  // Revenue grouped by date
  const revenueByDate: Record<string, number> = {};
  for (const apt of completedApts) {
    revenueByDate[apt.fecha] = (revenueByDate[apt.fecha] ?? 0) + (apt.precio_cobrado ?? 0);
  }
  const chartData = Object.entries(revenueByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date: date.slice(5), revenue: Number(revenue.toFixed(2)) }));

  // Top services
  const serviceRevenue: Record<string, { nombre: string; revenue: number; count: number }> = {};
  for (const apt of completedApts) {
    const nombre = apt.services?.nombre ?? 'Sin nombre';
    const sid = apt.service_id;
    if (!serviceRevenue[sid]) serviceRevenue[sid] = { nombre, revenue: 0, count: 0 };
    serviceRevenue[sid].revenue += apt.precio_cobrado ?? 0;
    serviceRevenue[sid].count += 1;
  }
  const topServices = Object.values(serviceRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const maxServiceRevenue = topServices[0]?.revenue ?? 1;

  // Rating distribution
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const rv of reviews) {
    const c = rv.calificacion as number;
    if (c >= 1 && c <= 5) distribution[c] = (distribution[c] ?? 0) + 1;
  }
  const avgRating = carWash?.rating_promedio ?? 0;
  const totalReviews = carWash?.total_reviews ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Reportes</h2>
        <p className="mt-1 text-sm text-muted-foreground">Analisis de rendimiento de tu autolavado</p>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap gap-1 rounded-card bg-muted p-1">
        {PERIOD_OPTIONS.map((opt) => {
          const isActive = opt.value === periodo;
          return (
            <Link
              key={opt.value}
              href={`/reportes?periodo=${opt.value}`}
              className={cn(
                'rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-card text-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Ingresos totales"
          value={`$${totalRevenue.toFixed(2)}`}
          subtitle="Solo citas completadas"
        />
        <MetricCard
          title="Total citas"
          value={totalCitas.toString()}
          subtitle="Todos los estados"
        />
        <MetricCard
          title="Ticket promedio"
          value={`$${ticketPromedio.toFixed(2)}`}
          subtitle="Por cita completada"
        />
      </div>

      {/* Revenue chart */}
      {chartData.length > 0 ? (
        <RevenueChart data={chartData} />
      ) : (
        <div className="rounded-card bg-card p-10 text-center text-sm text-muted-foreground shadow-card">
          No hay datos de ingresos para este periodo
        </div>
      )}

      {/* Two-column grid: top services + rating summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top services */}
        <div className="rounded-card bg-card p-6 shadow-card">
          <p className="mb-4 text-sm font-semibold text-muted-foreground">Top servicios</p>
          {topServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos para este periodo</p>
          ) : (
            <div className="space-y-3">
              {topServices.map((svc) => {
                const pct = maxServiceRevenue > 0 ? (svc.revenue / maxServiceRevenue) * 100 : 0;
                return (
                  <div key={svc.nombre}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{svc.nombre}</span>
                      <span className="text-muted-foreground">
                        ${svc.revenue.toFixed(2)} ({svc.count} citas)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-pill bg-muted">
                      <div
                        className="h-full rounded-pill bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rating summary */}
        <RatingSummary
          average={avgRating}
          total={totalReviews}
          distribution={distribution}
        />
      </div>
    </div>
  );
}
