import { createClient } from '@supabase/supabase-js';
import { StatusBadge } from '@/components/status-badge';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const subscriptionLabels: Record<string, string> = {
  trial: 'Trial',
  active: 'Activo',
  past_due: 'Vencido',
  cancelled: 'Cancelado',
};

const subscriptionStyles: Record<string, string> = {
  trial: 'bg-primary/10 text-primary',
  active: 'bg-accent/10 text-accent',
  past_due: 'bg-warning/10 text-warning',
  cancelled: 'bg-destructive/10 text-destructive',
};

export default async function NegociosPage() {
  const supabase = getSupabaseAdmin();

  const { data: carWashes } = await supabase
    .from('car_washes')
    .select('id, nombre, plan, subscription_status, verificado, rating_promedio, users!owner_id(nombre, email)')
    .order('created_at', { ascending: false }) as { data: any[] | null };

  const rows = carWashes ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Negocios</h2>
        <p className="mt-1 text-sm text-muted-foreground">{rows.length} autolavados registrados</p>
      </div>

      <div className="rounded-card bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Autolavado</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Dueno</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Plan</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Estatus</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Verificado</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Rating</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No hay negocios registrados
                  </td>
                </tr>
              ) : (
                rows.map((cw: any) => {
                  const status = cw.subscription_status ?? 'trial';
                  return (
                    <tr key={cw.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-6 py-3 font-medium text-foreground">{cw.nombre}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        <div>{cw.users?.nombre ?? '—'}</div>
                        <div className="text-xs">{cw.users?.email ?? ''}</div>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground capitalize">{cw.plan ?? '—'}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${
                            subscriptionStyles[status] ?? 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {subscriptionLabels[status] ?? status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {cw.verificado ? 'Si' : 'No'}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {cw.rating_promedio ? Number(cw.rating_promedio).toFixed(1) : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
