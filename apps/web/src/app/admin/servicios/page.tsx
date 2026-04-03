export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { HoursForm } from './hours-form';
import { ServiceForm } from './service-form';
import { ServiceTable } from './service-table';

export default async function ServiciosPage() {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id, num_estaciones')
    .eq('owner_id', user.id)
    .single() as { data: any };

  let services: any[] = [];
  let businessHours: any[] = [];

  if (carWash) {
    const { data: svcs } = await supabase
      .from('services')
      .select('id, nombre, descripcion, precio, duracion_min, categoria, es_complementario, activo, orden')
      .eq('car_wash_id', carWash.id)
      .order('orden', { ascending: true }) as { data: any[] | null };
    services = svcs ?? [];

    const { data: bh } = await supabase
      .from('business_hours')
      .select('dia_semana, hora_apertura, hora_cierre, cerrado')
      .eq('car_wash_id', carWash.id) as { data: any[] | null };
    businessHours = bh ?? [];
  }

  const hoursByDay = Object.fromEntries(businessHours.map((bh: any) => [bh.dia_semana, bh]));
  const numEstaciones = carWash?.num_estaciones ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Servicios</h2>
        <p className="mt-1 text-sm text-muted-foreground">Gestiona tus servicios, horarios y estaciones</p>
      </div>

      {/* ── Servicios ── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Servicios base</h3>
        <ServiceForm />
        <ServiceTable services={services.filter((s: any) => !s.es_complementario)} />
      </section>

      {services.some((s: any) => s.es_complementario) && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Servicios complementarios</h3>
          <ServiceTable services={services.filter((s: any) => s.es_complementario)} />
        </section>
      )}

      {/* ── Horario de operacion ── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Horario de operacion</h3>
        <div className="rounded-card bg-card shadow-card">
          <HoursForm hoursByDay={hoursByDay} />
        </div>
      </section>

      {/* ── Estaciones de lavado ── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Estaciones de lavado</h3>
        <div className="rounded-card bg-card p-6 shadow-card">
          <p className="mb-4 text-sm text-muted-foreground">
            Total de estaciones:{' '}
            <span className="font-semibold text-foreground">{numEstaciones}</span>
          </p>
          {numEstaciones > 0 ? (
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: numEstaciones }, (_, i) => (
                <div
                  key={i}
                  className="flex h-16 w-16 flex-col items-center justify-center rounded-card border-2 border-primary bg-primary/5"
                >
                  <span className="text-xs font-bold text-primary">E{i + 1}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay estaciones configuradas</p>
          )}
        </div>
      </section>
    </div>
  );
}
