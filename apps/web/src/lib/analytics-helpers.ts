// apps/web/src/lib/analytics-helpers.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AppointmentRow {
  id: string;
  fecha: string;
  hora_inicio: string;
  precio_cobrado: number | null;
  estado: string;
  service_id: string | null;
  client_id: string;
  service_name: string;
}

/**
 * Fetches completed+rated appointments for a car wash within a date range.
 * Optionally applies an hora_inicio cutoff (used for fair "hoy vs ayer"
 * comparisons where both ranges are truncated to the same time-of-day).
 */
export async function fetchCompletedAppointments(
  supabase: SupabaseClient,
  carWashId: string,
  range: { from: string; to: string },
  hourCutoff?: string
): Promise<AppointmentRow[]> {
  let query = supabase
    .from('appointments')
    .select('id, fecha, hora_inicio, precio_cobrado, estado, service_id, client_id, services(nombre)')
    .eq('car_wash_id', carWashId)
    .in('estado', ['completed', 'rated'])
    .gte('fecha', range.from)
    .lte('fecha', range.to);

  if (hourCutoff) {
    query = query.lte('hora_inicio', hourCutoff);
  }

  const { data } = await query;
  const rows = (data ?? []) as unknown as Array<{
    id: string;
    fecha: string;
    hora_inicio: string;
    precio_cobrado: number | null;
    estado: string;
    service_id: string | null;
    client_id: string;
    services: { nombre: string } | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    fecha: r.fecha,
    hora_inicio: r.hora_inicio,
    precio_cobrado: r.precio_cobrado,
    estado: r.estado,
    service_id: r.service_id,
    client_id: r.client_id,
    service_name: r.services?.nombre ?? 'Sin servicio',
  }));
}

/**
 * Returns the sum of units and revenue from a list of appointment rows.
 */
export function aggregateTotals(rows: AppointmentRow[]): { units: number; revenue: number } {
  return {
    units: rows.length,
    revenue: rows.reduce((sum, r) => sum + Number(r.precio_cobrado ?? 0), 0),
  };
}

/**
 * Verifies the authenticated user owns the given car wash.
 * Returns true if authorized, false otherwise.
 */
export async function verifyCarWashOwnership(
  supabase: SupabaseClient,
  carWashId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('car_washes')
    .select('owner_id')
    .eq('id', carWashId)
    .single();
  return !!data && data.owner_id === userId;
}
