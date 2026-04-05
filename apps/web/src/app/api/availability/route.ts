import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const car_wash_id = searchParams.get('car_wash_id');
  const fecha = searchParams.get('fecha');

  if (!car_wash_id || !fecha) {
    return NextResponse.json(
      { error: 'car_wash_id y fecha son requeridos' },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabase();

  // 1. Get slot_duration_min and num_estaciones from car_washes
  const { data: carWash, error: carWashError } = await supabase
    .from('car_washes')
    .select('slot_duration_min, num_estaciones')
    .eq('id', car_wash_id)
    .single();

  if (carWashError || !carWash) {
    return NextResponse.json({ error: 'Car wash no encontrado' }, { status: 404 });
  }

  const slot_duration_min: number = carWash.slot_duration_min ?? 60;

  // 2. Get day of week from fecha
  const dayOfWeek = new Date(fecha + 'T12:00:00').getDay();

  // 3. Get business hours for that day
  const { data: businessHours, error: hoursError } = await supabase
    .from('business_hours')
    .select('hora_apertura, hora_cierre, cerrado')
    .eq('car_wash_id', car_wash_id)
    .eq('dia_semana', dayOfWeek)
    .single();

  if (hoursError || !businessHours) {
    return NextResponse.json({ slots: [], closed: true, slot_duration_min });
  }

  if (businessHours.cerrado) {
    return NextResponse.json({ slots: [], closed: true, slot_duration_min });
  }

  // 4. Get slot_capacities for that car_wash_id and dia_semana
  const { data: slotCapacities } = await supabase
    .from('slot_capacities')
    .select('hora, capacidad')
    .eq('car_wash_id', car_wash_id)
    .eq('dia_semana', dayOfWeek);

  const capacityMap = new Map<string, number>();
  for (const sc of slotCapacities ?? []) {
    const hora = String(sc.hora).slice(0, 5); // normalize "HH:MM:SS" → "HH:MM"
    capacityMap.set(hora, sc.capacidad);
  }

  // 5. Get existing appointments for that date (not cancelled/no_show)
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('hora_inicio')
    .eq('car_wash_id', car_wash_id)
    .eq('fecha', fecha)
    .not('estado', 'in', '("cancelled","no_show")');

  if (appointmentsError) {
    return NextResponse.json({ error: 'Error al obtener citas' }, { status: 500 });
  }

  // Count appointments per slot
  const ocupadosMap = new Map<string, number>();
  for (const appt of appointments ?? []) {
    const hora = String(appt.hora_inicio).slice(0, 5);
    ocupadosMap.set(hora, (ocupadosMap.get(hora) ?? 0) + 1);
  }

  // 6. Generate slots from open to close using slot_duration_min
  const openMinutes = timeToMinutes(businessHours.hora_apertura);
  const closeMinutes = timeToMinutes(businessHours.hora_cierre);

  const numEstaciones = carWash.num_estaciones ?? 1;
  const slots = [];
  for (let start = openMinutes; start + slot_duration_min <= closeMinutes; start += slot_duration_min) {
    const time = minutesToTime(start);
    const rawCapacidad = capacityMap.get(time) ?? numEstaciones;
    const capacidad = Math.min(rawCapacidad, numEstaciones);
    const ocupados = ocupadosMap.get(time) ?? 0;
    const disponibles = Math.max(0, capacidad - ocupados);

    slots.push({ time, capacidad, ocupados, disponibles });
  }

  return NextResponse.json({ slots, closed: false, slot_duration_min });
}
