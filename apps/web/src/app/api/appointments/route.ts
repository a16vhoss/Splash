import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createAppointmentSchema, NotifType, SubStatus } from '@splash/shared';
import { sendBookingConfirmationClient, sendBookingConfirmationAdmin } from '@/lib/email';
import { insertNotifications } from '@/lib/notifications';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  // 1. Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // 2. Validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = createAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { car_wash_id, service_id, fecha, hora_inicio, notas_cliente } = parsed.data;

  // 3. Get service
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('nombre, duracion_min, precio, activo')
    .eq('id', service_id)
    .single();

  if (serviceError || !service) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
  }

  if (!service.activo) {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 422 });
  }

  // Fetch complementary services if provided
  let complementaryServices: any[] = [];
  let totalPrice = service.precio;

  if ((parsed.data as any).servicios_complementarios?.length) {
    const { data: compServices } = await supabase
      .from('services')
      .select('id, nombre, precio, duracion_min')
      .in('id', (parsed.data as any).servicios_complementarios)
      .eq('car_wash_id', car_wash_id)
      .eq('es_complementario', true)
      .eq('activo', true);

    if (compServices) {
      complementaryServices = compServices;
      totalPrice += compServices.reduce((sum: number, s: any) => sum + s.precio, 0);
    }
  }

  // 4. Get car wash (includes slot_duration_min)
  const { data: carWash, error: carWashError } = await supabase
    .from('car_washes')
    .select('nombre, direccion, slot_duration_min, num_estaciones, activo, subscription_status, owner_id')
    .eq('id', car_wash_id)
    .single();

  if (carWashError || !carWash) {
    return NextResponse.json({ error: 'Car wash no encontrado' }, { status: 404 });
  }

  // 5. Validate car wash availability
  if (!carWash.activo) {
    return NextResponse.json({ error: 'Car wash no disponible' }, { status: 422 });
  }

  const validSubscriptionStatuses: string[] = [SubStatus.ACTIVE, SubStatus.TRIAL];
  if (!validSubscriptionStatuses.includes(carWash.subscription_status)) {
    return NextResponse.json({ error: 'Car wash no disponible' }, { status: 422 });
  }

  // 6. Calculate hora_fin using slot_duration_min
  const slotDuration = carWash.slot_duration_min ?? 30;
  const startMinutes = timeToMinutes(hora_inicio);
  const hora_fin = minutesToTime(startMinutes + slotDuration);

  // 7. Check slot capacity
  // dia_semana: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const fechaDate = new Date(fecha + 'T00:00:00');
  const diaSemana = fechaDate.getDay();

  const { data: slotCapacity, error: slotError } = await supabase
    .from('slot_capacities')
    .select('capacidad')
    .eq('car_wash_id', car_wash_id)
    .eq('dia_semana', diaSemana)
    .eq('hora', hora_inicio + ':00')
    .maybeSingle();

  if (slotError) {
    return NextResponse.json({ error: 'Error al verificar disponibilidad' }, { status: 500 });
  }

  // If no slot_capacity row exists, use num_estaciones as default
  const capacidad = slotCapacity
    ? Math.min(slotCapacity.capacidad, carWash.num_estaciones ?? 1)
    : (carWash.num_estaciones ?? 1);

  // Count existing non-cancelled appointments at this exact hora_inicio
  const { count, error: countError } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('car_wash_id', car_wash_id)
    .eq('fecha', fecha)
    .eq('hora_inicio', hora_inicio)
    .not('estado', 'in', '("cancelled","no_show")');

  if (countError) {
    return NextResponse.json({ error: 'Error al verificar disponibilidad' }, { status: 500 });
  }

  if ((count ?? 0) >= capacidad) {
    return NextResponse.json({ error: 'Horario ya no disponible' }, { status: 409 });
  }

  // 8. Insert appointment (no estacion field)
  const { data: appointment, error: insertError } = await supabase
    .from('appointments')
    .insert({
      car_wash_id,
      service_id,
      client_id: user.id,
      fecha,
      hora_inicio,
      hora_fin,
      precio_cobrado: totalPrice,
      precio_total: totalPrice,
      servicios_complementarios: complementaryServices.length > 0
        ? complementaryServices.map((s: any) => ({ id: s.id, nombre: s.nombre, precio: s.precio, duracion_min: s.duracion_min }))
        : null,
      estado: 'confirmed',
      metodo_pago: (parsed.data as any).metodo_pago ?? null,
      estado_pago: 'pendiente',
      notas_cliente: notas_cliente ?? null,
    })
    .select()
    .single();

  if (insertError || !appointment) {
    console.error('Insert appointment error:', insertError);
    return NextResponse.json({ error: insertError?.message ?? 'Error al crear cita' }, { status: 500 });
  }

  // 9. Create notifications for client and car wash owner (uses service role to bypass RLS)
  await insertNotifications([
    {
      user_id: user.id,
      appointment_id: appointment.id,
      tipo: NotifType.CONFIRMATION,
      titulo: 'Cita confirmada',
      mensaje: `Tu cita para el ${fecha} a las ${hora_inicio} ha sido confirmada.`,
    },
    {
      user_id: carWash.owner_id,
      appointment_id: appointment.id,
      tipo: NotifType.CONFIRMATION,
      titulo: 'Nueva cita',
      mensaje: `Nueva cita el ${fecha} a las ${hora_inicio}.`,
    },
  ]);

  // Send confirmation emails (fire-and-forget)
  const { data: clientUser } = await supabase
    .from('users')
    .select('email, nombre')
    .eq('id', user.id)
    .single();

  const { data: ownerUser } = await supabase
    .from('users')
    .select('email')
    .eq('id', carWash.owner_id)
    .single();

  if (clientUser?.email) {
    sendBookingConfirmationClient(clientUser.email, {
      carWashName: carWash.nombre,
      serviceName: service.nombre,
      fecha,
      hora: hora_inicio,
      precio: String(totalPrice),
      direccion: carWash.direccion ?? '',
    });
  }

  if (ownerUser?.email) {
    sendBookingConfirmationAdmin(ownerUser.email, {
      clientName: clientUser?.nombre ?? 'Cliente',
      serviceName: service.nombre,
      fecha,
      hora: hora_inicio,
      precio: String(totalPrice),
    });
  }

  // 10. Return 201
  return NextResponse.json({ appointment }, { status: 201 });
}
