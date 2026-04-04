import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { NotifType } from '@splash/shared';

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

  // 2. Role check
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData || userData.role !== 'wash_admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // 3. Parse body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { car_wash_id, service_id, fecha, hora_inicio, cliente_nombre, metodo_pago } = body;

  if (!car_wash_id || !service_id || !fecha || !hora_inicio) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  // 4. Verify car wash ownership
  const { data: carWash, error: carWashError } = await supabase
    .from('car_washes')
    .select('id, nombre, owner_id, slot_duration_min')
    .eq('id', car_wash_id)
    .eq('owner_id', user.id)
    .single();

  if (carWashError || !carWash) {
    return NextResponse.json({ error: 'Autolavado no encontrado o sin permisos' }, { status: 403 });
  }

  // 5. Get service
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('nombre, precio')
    .eq('id', service_id)
    .eq('car_wash_id', car_wash_id)
    .single();

  if (serviceError || !service) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
  }

  // 6. Check slot capacity
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

  if (!slotCapacity) {
    return NextResponse.json({ error: 'Horario no disponible' }, { status: 409 });
  }

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

  if ((count ?? 0) >= slotCapacity.capacidad) {
    return NextResponse.json({ error: 'Horario lleno' }, { status: 409 });
  }

  // 7. Calculate hora_fin
  const slotDuration = carWash.slot_duration_min ?? 30;
  const hora_fin = minutesToTime(timeToMinutes(hora_inicio) + slotDuration);

  // 8. Build notas_cliente
  const notas = cliente_nombre ? `Walk-in: ${cliente_nombre}` : 'Walk-in';

  // 9. Insert appointment
  const { data: appointment, error: insertError } = await supabase
    .from('appointments')
    .insert({
      car_wash_id,
      service_id,
      client_id: null,
      fecha,
      hora_inicio,
      hora_fin,
      precio_cobrado: service.precio,
      precio_total: service.precio,
      estado: 'confirmed',
      metodo_pago: metodo_pago ?? null,
      estado_pago: metodo_pago ? 'pagado' : 'pendiente',
      notas_cliente: notas,
    })
    .select()
    .single();

  if (insertError || !appointment) {
    console.error('Insert admin appointment error:', insertError);
    return NextResponse.json({ error: insertError?.message ?? 'Error al crear cita' }, { status: 500 });
  }

  // 10. Create notification for admin (leida: true — no need to alert, they created it)
  await supabase.from('notifications').insert({
    user_id: user.id,
    appointment_id: appointment.id,
    tipo: NotifType.CONFIRMATION,
    titulo: 'Cita walk-in creada',
    mensaje: `Cita walk-in${cliente_nombre ? ` para ${cliente_nombre}` : ''} el ${fecha} a las ${hora_inicio}.`,
    leida: true,
  });

  return NextResponse.json({ appointment }, { status: 201 });
}
