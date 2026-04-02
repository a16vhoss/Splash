import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
  };
}

export interface AvailabilityParams {
  car_wash_id: string;
  service_id: string;
  fecha: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  estaciones_libres: number;
}

export async function fetchAvailability(params: AvailabilityParams): Promise<{ slots: TimeSlot[]; closed: boolean }> {
  const headers = await getAuthHeaders();
  const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
  const res = await fetch(`${API_URL}/api/availability?${query}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch availability');
  return res.json();
}

export interface CreateAppointmentParams {
  car_wash_id: string;
  service_id: string;
  fecha: string;
  hora_inicio: string;
}

export async function createAppointment(params: CreateAppointmentParams): Promise<{ appointment: any }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/appointments`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to create appointment');
  }
  return res.json();
}

export async function fetchMyAppointments(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      car_washes ( nombre, direccion ),
      services ( nombre, precio, duracion_min )
    `)
    .eq('client_id', user.id)
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function cancelAppointment(id: string, motivo_cancelacion: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/appointments/${id}/cancel`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ motivo_cancelacion }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Failed to cancel appointment');
  }
}
