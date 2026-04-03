import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabase } from '@/lib/supabase/server';
import { CANCELLATION_HOURS_LIMIT, NotifType } from '@splash/shared';
import { sendCancellationEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  // 1. Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // 2. Get appointment
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('id, client_id, car_wash_id, service_id, fecha, hora_inicio, estado, estado_pago, stripe_payment_id, car_washes(owner_id, nombre), services(nombre)')
    .eq('id', id)
    .single();

  if (fetchError || !appointment) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
  }

  if (appointment.estado !== 'confirmed') {
    return NextResponse.json({ error: 'Solo se pueden cancelar citas confirmadas' }, { status: 422 });
  }

  const isClient = user.id === appointment.client_id;
  const carWash = appointment.car_washes as unknown as { owner_id: string; nombre: string } | null;
  const service = appointment.services as unknown as { nombre: string } | null;
  const isAdmin = carWash ? user.id === carWash.owner_id : false;

  if (!isClient && !isAdmin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // 3. If client canceling, check cancellation window
  if (isClient) {
    const appointmentDateTime = new Date(`${appointment.fecha}T${appointment.hora_inicio}`);
    const now = new Date();
    const diffMs = appointmentDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < CANCELLATION_HOURS_LIMIT) {
      return NextResponse.json(
        { error: `No se puede cancelar con menos de ${CANCELLATION_HOURS_LIMIT} horas de anticipación` },
        { status: 422 }
      );
    }
  }

  // Parse motivo from body
  let motivo_cancelacion: string | null = null;
  try {
    const body = await request.json();
    motivo_cancelacion = body?.motivo_cancelacion ?? null;
  } catch {
    // motivo is optional
  }

  // 4. Update appointment
  const { error: updateError } = await supabase
    .from('appointments')
    .update({
      estado: 'cancelled',
      cancelado_por: user.id,
      motivo_cancelacion,
    })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: 'Error al cancelar cita' }, { status: 500 });
  }

  // Refund if paid online
  if (appointment.estado_pago === 'pagado' && appointment.stripe_payment_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      await stripe.refunds.create({
        payment_intent: appointment.stripe_payment_id,
      });

      await supabase
        .from('appointments')
        .update({ estado_pago: 'reembolsado' })
        .eq('id', id);
    } catch (err) {
      console.error('[stripe] Refund failed:', err);
      // Don't block cancellation if refund fails
    }
  }

  // 5. Notify the other party
  const notifyUserId = isClient ? carWash?.owner_id : appointment.client_id;

  if (notifyUserId) {
    await supabase.from('notifications').insert({
      user_id: notifyUserId,
      appointment_id: id,
      tipo: NotifType.CANCELLATION,
      titulo: 'Cita cancelada',
      mensaje: isClient
        ? `El cliente canceló la cita del ${appointment.fecha} a las ${appointment.hora_inicio}.`
        : `Tu cita del ${appointment.fecha} a las ${appointment.hora_inicio} fue cancelada.`,
      leida: false,
    });
  }

  // Send cancellation emails (fire-and-forget)
  const { data: clientUser } = await supabase
    .from('users')
    .select('email')
    .eq('id', appointment.client_id)
    .single();

  const { data: ownerUser } = await supabase
    .from('users')
    .select('email')
    .eq('id', carWash?.owner_id ?? '')
    .single();

  const cancelEmailData = {
    carWashName: carWash?.nombre ?? '',
    serviceName: service?.nombre ?? '',
    fecha: appointment.fecha,
    hora: appointment.hora_inicio?.slice(0, 5) ?? '',
    motivo: motivo_cancelacion ?? '',
  };

  if (clientUser?.email) {
    sendCancellationEmail(clientUser.email, { ...cancelEmailData, isAdmin: false });
  }
  if (ownerUser?.email) {
    sendCancellationEmail(ownerUser.email, { ...cancelEmailData, isAdmin: true });
  }

  return NextResponse.json({ success: true });
}
