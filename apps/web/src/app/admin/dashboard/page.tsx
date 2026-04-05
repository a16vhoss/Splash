export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminCarWash } from '@/lib/admin-car-wash';
import { MetricCard } from '@/components/metric-card';
import { StatusBadge } from '@/components/status-badge';
import { completeAppointment } from '@/app/admin/citas/actions';

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const carWash = await getAdminCarWash('id, nombre, rating_promedio, total_reviews, activo, subscription_status') as any;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let todayCount = 0;
  let yesterdayCount = 0;
  let todayRevenue = 0;
  let upcomingAppointments: any[] = [];

  if (carWash) {
    const { count: tc } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('car_wash_id', carWash.id)
      .eq('fecha', today);
    todayCount = tc ?? 0;

    const { count: yc } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('car_wash_id', carWash.id)
      .eq('fecha', yesterday);
    yesterdayCount = yc ?? 0;

    const { data: revenueRows } = await supabase
      .from('appointments')
      .select('precio_cobrado')
      .eq('car_wash_id', carWash.id)
      .eq('fecha', today)
      .eq('estado', 'completed') as { data: any[] | null };

    todayRevenue = (revenueRows ?? []).reduce((sum: number, r: any) => sum + (r.precio_cobrado ?? 0), 0);

    const { data: upcoming } = await supabase
      .from('appointments')
      .select('id, fecha, hora_inicio, estado, precio_cobrado, estacion, users!client_id(nombre, email), services!service_id(nombre)')
      .eq('car_wash_id', carWash.id)
      .gte('fecha', today)
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true })
      .limit(10) as { data: any[] | null };

    upcomingAppointments = upcoming ?? [];
  }

  const trendDiff = todayCount - yesterdayCount;
  const trendVal = trendDiff === 0 ? '0' : Math.abs(trendDiff).toString();

  const rating = carWash?.rating_promedio ?? 0;
  const totalReviews = carWash?.total_reviews ?? 0;
  const estatus = carWash?.activo ? 'Activo' : 'Inactivo';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Citas hoy"
          value={todayCount.toString()}
          trend={{ value: trendVal, positive: trendDiff >= 0 }}
          subtitle="vs ayer"
        />
        <MetricCard
          title="Ingresos hoy"
          value={`$${todayRevenue.toFixed(2)}`}
          subtitle="Solo completadas"
        />
        <MetricCard
          title="Calificacion"
          value={rating > 0 ? rating.toFixed(1) : '—'}
          subtitle={`${totalReviews} resenas`}
        />
        <MetricCard
          title="Estatus"
          value={estatus}
          subtitle={carWash?.subscription_status ?? ''}
        />
      </div>

      <div className="rounded-card bg-card shadow-card">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">Proximas citas</h3>
        </div>
        {upcomingAppointments.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No hay citas proximas
          </div>
        ) : (
          <>
          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-border">
            {upcomingAppointments.map((apt: any) => (
              <div key={apt.id} className="px-4 py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground text-sm">{apt.users?.nombre || apt.users?.email || '—'}</span>
                  <StatusBadge status={apt.estado} />
                </div>
                <p className="text-xs text-muted-foreground">{apt.services?.nombre ?? '—'}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{apt.fecha}</span>
                  <span>{apt.hora_inicio?.slice(0, 5)}</span>
                  <span>E{apt.estacion}</span>
                </div>
                {(apt.estado === 'confirmed' || apt.estado === 'in_progress') && (
                  <form action={async () => { 'use server'; await completeAppointment(apt.id); const { revalidatePath } = await import('next/cache'); revalidatePath('/admin/dashboard'); }}>
                    <button type="submit" className="mt-1 text-xs font-medium text-primary hover:underline">Completar</button>
                  </form>
                )}
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Cliente</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Servicio</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Fecha</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Hora</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Estacion</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppointments.map((apt: any) => (
                  <tr key={apt.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-3 font-medium text-foreground">
                      {apt.users?.nombre || apt.users?.email || '—'}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {apt.services?.nombre ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{apt.fecha}</td>
                    <td className="px-6 py-3 text-muted-foreground">{apt.hora_inicio?.slice(0, 5)}</td>
                    <td className="px-6 py-3 text-muted-foreground">E{apt.estacion}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={apt.estado} />
                    </td>
                    <td className="px-6 py-3">
                      {(apt.estado === 'confirmed' || apt.estado === 'in_progress') && (
                        <form action={async () => { 'use server'; await completeAppointment(apt.id); const { revalidatePath } = await import('next/cache'); revalidatePath('/admin/dashboard'); }}>
                          <button type="submit" className="rounded-input bg-accent px-3 py-1 text-xs font-semibold text-white hover:bg-accent/90">
                            Completar
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
