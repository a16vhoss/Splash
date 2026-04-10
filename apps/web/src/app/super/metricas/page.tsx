export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { MetricCard } from '@/components/metric-card';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const PLAN_PRICES: Record<string, number> = {
  basico: 499,
  pro: 999,
  premium: 1999,
};

export default async function MetricasPage() {
  const supabase = getSupabaseAdmin();

  // Total negocios (activo = true)
  const { count: totalNegocios } = await supabase
    .from('car_washes')
    .select('id', { count: 'exact', head: true })
    .eq('activo', true);

  // Negocios activos (trial or active subscription_status)
  const { count: negociosActivos } = await supabase
    .from('car_washes')
    .select('id', { count: 'exact', head: true })
    .in('subscription_status', ['trial', 'active']);

  // GMV total — sum precio_cobrado from completed appointments
  const { data: gmvRows } = await supabase
    .from('appointments')
    .select('precio_cobrado')
    .in('estado', ['completed', 'rated']) as { data: { precio_cobrado: number | null }[] | null };

  const gmvTotal = (gmvRows ?? []).reduce((sum, r) => sum + (r.precio_cobrado ?? 0), 0);

  // MRR — sum monthly prices from active subscriptions
  const { data: activeSubs } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('status', 'active') as { data: { plan: string }[] | null };

  const mrr = (activeSubs ?? []).reduce((sum, sub) => {
    return sum + (PLAN_PRICES[sub.plan] ?? 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Metricas</h2>
        <p className="mt-1 text-sm text-muted-foreground">Resumen global de la plataforma</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total negocios"
          value={(totalNegocios ?? 0).toString()}
          subtitle="Autolavados activos en la plataforma"
        />
        <MetricCard
          title="Negocios activos"
          value={(negociosActivos ?? 0).toString()}
          subtitle="Con suscripcion trial o activa"
        />
        <MetricCard
          title="GMV total"
          value={`$${gmvTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Suma de citas completadas"
        />
        <MetricCard
          title="MRR"
          value={`$${mrr.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Ingresos mensuales recurrentes"
        />
      </div>
    </div>
  );
}
