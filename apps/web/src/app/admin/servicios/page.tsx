export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminCarWash } from '@/lib/admin-car-wash';
import { HoursForm } from './hours-form';
import { ServiceForm } from './service-form';
import { ServiceTable } from './service-table';
import { StationManager } from './station-manager';

export default async function ServiciosPage() {
  const supabase = await createServerSupabase();

  const carWash = await getAdminCarWash('id, num_estaciones') as any;

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
        <StationManager initialCount={numEstaciones} />
      </section>
    </div>
  );
}
