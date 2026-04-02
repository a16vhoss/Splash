import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { SLOT_DURATION_MIN } from '@splash/shared';

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
  const service_id = searchParams.get('service_id');
  const fecha = searchParams.get('fecha');

  if (!car_wash_id || !service_id || !fecha) {
    return NextResponse.json(
      { error: 'car_wash_id, service_id y fecha son requeridos' },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabase();

  // 1. Get service duration
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('duracion_min')
    .eq('id', service_id)
    .single();

  if (serviceError || !service) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
  }

  // 2. Get car wash station count
  const { data: carWash, error: carWashError } = await supabase
    .from('car_washes')
    .select('num_estaciones')
    .eq('id', car_wash_id)
    .single();

  if (carWashError || !carWash) {
    return NextResponse.json({ error: 'Car wash no encontrado' }, { status: 404 });
  }

  // 3. Get business hours for the day of week
  const dayOfWeek = new Date(fecha + 'T12:00:00').getDay();

  const { data: businessHours, error: hoursError } = await supabase
    .from('business_hours')
    .select('hora_apertura, hora_cierre, cerrado')
    .eq('car_wash_id', car_wash_id)
    .eq('dia_semana', dayOfWeek)
    .single();

  if (hoursError || !businessHours) {
    return NextResponse.json({ error: 'Horario no encontrado' }, { status: 404 });
  }

  // 4. If closed, return empty slots
  if (businessHours.cerrado) {
    return NextResponse.json({ slots: [], closed: true });
  }

  // 5. Get existing appointments for that date (excluding cancelled/no_show)
  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select('hora_inicio, hora_fin')
    .eq('car_wash_id', car_wash_id)
    .eq('fecha', fecha)
    .not('estado', 'in', '("cancelled","no_show")');

  if (appointmentsError) {
    return NextResponse.json({ error: 'Error al obtener citas' }, { status: 500 });
  }

  const existingAppointments = appointments ?? [];
  const openMinutes = timeToMinutes(businessHours.hora_apertura);
  const closeMinutes = timeToMinutes(businessHours.hora_cierre);
  const { duracion_min } = service;
  const { num_estaciones } = carWash;

  // 6. Generate 30-min slots from open to close - service duration
  const slots = [];
  for (let start = openMinutes; start + duracion_min <= closeMinutes; start += SLOT_DURATION_MIN) {
    const slotStart = minutesToTime(start);
    // Count overlapping appointments
    const overlapping = existingAppointments.filter((appt) => {
      const aStart = timeToMinutes(appt.hora_inicio);
      const aEnd = timeToMinutes(appt.hora_fin);
      const sEnd = start + duracion_min;
      return aStart < sEnd && aEnd > start;
    }).length;

    const estaciones_libres = num_estaciones - overlapping;

    slots.push({
      time: slotStart,
      available: estaciones_libres > 0,
      estaciones_libres,
    });
  }

  return NextResponse.json({ slots, closed: false });
}
