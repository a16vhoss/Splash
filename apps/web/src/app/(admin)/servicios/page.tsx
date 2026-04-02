import { createServerSupabase } from '@/lib/supabase/server';
import { createService, deleteService, toggleService } from './actions';

const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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
      .select('id, nombre, precio, duracion_min, activo, orden')
      .eq('car_wash_id', carWash.id)
      .order('orden', { ascending: true }) as { data: any[] | null };
    services = svcs ?? [];

    const { data: bh } = await supabase
      .from('business_hours')
      .select('day_of_week, apertura, cierre, activo')
      .eq('car_wash_id', carWash.id) as { data: any[] | null };
    businessHours = bh ?? [];
  }

  const hoursByDay = Object.fromEntries(businessHours.map((bh: any) => [bh.day_of_week, bh]));
  const numEstaciones = carWash?.num_estaciones ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Servicios</h2>
        <p className="mt-1 text-sm text-muted-foreground">Gestiona tus servicios, horarios y estaciones</p>
      </div>

      {/* ── Servicios ── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Mis servicios</h3>

        {/* New service form */}
        <form action={createService} className="rounded-card bg-card p-6 shadow-card">
          <p className="mb-4 text-sm font-semibold text-muted-foreground">Agregar servicio</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Nombre
              </label>
              <input
                name="nombre"
                required
                minLength={2}
                maxLength={150}
                placeholder="Lavado basico"
                className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Precio ($)
              </label>
              <input
                name="precio"
                type="number"
                required
                min={1}
                step="0.01"
                placeholder="150.00"
                className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Duracion (min)
              </label>
              <input
                name="duracion_min"
                type="number"
                required
                min={15}
                max={480}
                placeholder="30"
                className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="rounded-input bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Agregar servicio
            </button>
          </div>
        </form>

        {/* Services table */}
        <div className="rounded-card bg-card shadow-card">
          {services.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No hay servicios registrados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Nombre</th>
                    <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Precio</th>
                    <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Duracion</th>
                    <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Estado</th>
                    <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((svc: any) => (
                    <tr key={svc.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-6 py-3 font-medium text-foreground">{svc.nombre}</td>
                      <td className="px-6 py-3 text-muted-foreground">${(svc.precio ?? 0).toFixed(2)}</td>
                      <td className="px-6 py-3 text-muted-foreground">{svc.duracion_min} min</td>
                      <td className="px-6 py-3">
                        <span
                          className={
                            svc.activo
                              ? 'rounded-pill bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent'
                              : 'rounded-pill bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground'
                          }
                        >
                          {svc.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <form action={toggleService.bind(null, svc.id, !svc.activo)}>
                            <button
                              type="submit"
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              {svc.activo ? 'Desactivar' : 'Activar'}
                            </button>
                          </form>
                          <form action={deleteService.bind(null, svc.id)}>
                            <button
                              type="submit"
                              className="text-xs font-semibold text-destructive hover:underline"
                            >
                              Eliminar
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── Horario de operacion ── */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Horario de operacion</h3>
        <div className="rounded-card bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Dia</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Apertura</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Cierre</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {DAY_KEYS.map((key, i) => {
                  const bh = hoursByDay[key];
                  const abierto = bh?.activo;
                  return (
                    <tr key={key} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-6 py-3 font-medium text-foreground">{DAYS[i]}</td>
                      <td className="px-6 py-3 font-mono text-muted-foreground">
                        {bh?.apertura?.slice(0, 5) ?? '—'}
                      </td>
                      <td className="px-6 py-3 font-mono text-muted-foreground">
                        {bh?.cierre?.slice(0, 5) ?? '—'}
                      </td>
                      <td className="px-6 py-3">
                        {!bh ? (
                          <span className="rounded-pill bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                            Sin configurar
                          </span>
                        ) : abierto ? (
                          <span className="rounded-pill bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                            Abierto
                          </span>
                        ) : (
                          <span className="rounded-pill bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                            Cerrado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
