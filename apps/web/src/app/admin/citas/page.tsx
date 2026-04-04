export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminCarWash } from '@/lib/admin-car-wash';
import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import { completeAppointment, markAsPaid } from './actions';
import { AdminNewAppointment } from './admin-new-appointment';

const FILTER_TABS = [
  { label: 'Todas', estado: undefined },
  { label: 'Confirmadas', estado: 'confirmed' },
  { label: 'En progreso', estado: 'in_progress' },
  { label: 'Completadas', estado: 'completed' },
  { label: 'Canceladas', estado: 'cancelled' },
];

export default async function CitasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const supabase = await createServerSupabase();

  const carWash = await getAdminCarWash('id') as any;

  let appointments: any[] = [];
  let services: { id: string; nombre: string }[] = [];

  if (carWash) {
    // Query services for the new appointment form
    const { data: servicesData } = await supabase
      .from('services')
      .select('id, nombre')
      .eq('car_wash_id', carWash.id)
      .eq('activo', true)
      .eq('es_complementario', false)
      .order('nombre');
    services = servicesData ?? [];

    let query = supabase
      .from('appointments')
      .select('id, fecha, hora_inicio, estado, precio_cobrado, estacion, metodo_pago, estado_pago, notas_cliente, users!client_id(nombre), services!service_id(nombre)')
      .eq('car_wash_id', carWash.id)
      .order('fecha', { ascending: false })
      .limit(50);

    if (estado) {
      query = query.eq('estado', estado);
    }

    const { data } = await query as { data: any[] | null };
    appointments = data ?? [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Citas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Gestion de citas de tu autolavado</p>
        </div>
        {carWash && services.length > 0 && (
          <AdminNewAppointment carWashId={carWash.id} services={services} />
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 rounded-card bg-muted p-1">
        {FILTER_TABS.map((tab) => {
          const isActive = (tab.estado ?? '') === (estado ?? '');
          const href = tab.estado ? `/admin/citas?estado=${tab.estado}` : '/admin/citas';
          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                'rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-card text-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="rounded-card bg-card shadow-card">
        {appointments.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No hay citas{estado ? ` con estado "${estado}"` : ''}
          </div>
        ) : (
          <>
          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-border">
            {appointments.map((apt: any) => {
              const clientName = apt.users?.nombre
                ? apt.users.nombre
                : apt.notas_cliente?.startsWith('Walk-in:')
                  ? apt.notas_cliente.slice('Walk-in:'.length).trim()
                  : apt.notas_cliente === 'Walk-in'
                    ? 'Walk-in'
                    : '—';
              return (
                <div key={apt.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground text-sm">{clientName}</span>
                    <StatusBadge status={apt.estado} />
                  </div>
                  <p className="text-xs text-muted-foreground">{apt.services?.nombre ?? '—'}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{apt.fecha}</span>
                    <span className="font-mono">{apt.hora_inicio?.slice(0, 5)}</span>
                    <span>E{apt.estacion}</span>
                    <span>${(apt.precio_cobrado ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={
                      apt.estado_pago === 'pagado'
                        ? 'rounded-pill bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent'
                        : 'rounded-pill bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning'
                    }>
                      {apt.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}
                    </span>
                    {apt.metodo_pago && (
                      <span className="text-[11px] text-muted-foreground">{apt.metodo_pago}</span>
                    )}
                    {apt.estado_pago !== 'pagado' && apt.estado !== 'cancelled' && (
                      <form action={markAsPaid.bind(null, apt.id)}>
                        <button type="submit" className="text-xs font-semibold text-primary hover:underline">
                          Marcar pagado
                        </button>
                      </form>
                    )}
                    {(apt.estado === 'confirmed' || apt.estado === 'in_progress') && (
                      <form action={completeAppointment.bind(null, apt.id)}>
                        <button type="submit" className="text-xs font-semibold text-accent hover:underline">
                          Completar
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Hora</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Cliente</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Servicio</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Fecha</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Estacion</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Precio</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Pago</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Estado</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt: any) => (
                  <tr key={apt.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-3 font-mono text-muted-foreground">
                      {apt.hora_inicio?.slice(0, 5)}
                    </td>
                    <td className="px-6 py-3 font-medium text-foreground">
                      {apt.users?.nombre
                        ? apt.users.nombre
                        : apt.notas_cliente?.startsWith('Walk-in:')
                          ? apt.notas_cliente.slice('Walk-in:'.length).trim()
                          : apt.notas_cliente === 'Walk-in'
                            ? 'Walk-in'
                            : '—'}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {apt.services?.nombre ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{apt.fecha}</td>
                    <td className="px-6 py-3 text-muted-foreground">E{apt.estacion}</td>
                    <td className="px-6 py-3 text-muted-foreground">
                      ${(apt.precio_cobrado ?? 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className={
                          apt.estado_pago === 'pagado'
                            ? 'rounded-pill bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent'
                            : 'rounded-pill bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning'
                        }>
                          {apt.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}
                        </span>
                        {apt.estado_pago !== 'pagado' && apt.estado !== 'cancelled' && (
                          <form action={markAsPaid.bind(null, apt.id)}>
                            <button type="submit" className="text-xs font-semibold text-primary hover:underline">
                              Marcar pagado
                            </button>
                          </form>
                        )}
                      </div>
                      {apt.metodo_pago && (
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">{apt.metodo_pago}</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={apt.estado} />
                    </td>
                    <td className="px-6 py-3">
                      {(apt.estado === 'confirmed' || apt.estado === 'in_progress') && (
                        <form action={completeAppointment.bind(null, apt.id)}>
                          <button
                            type="submit"
                            className="text-xs font-semibold text-accent hover:underline"
                          >
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
