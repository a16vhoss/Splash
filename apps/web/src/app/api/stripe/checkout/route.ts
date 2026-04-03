import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabase } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PLATFORM_FEE_PERCENT = 10;

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const { appointment_id } = body;

  if (!appointment_id) {
    return NextResponse.json({ error: 'appointment_id requerido' }, { status: 400 });
  }

  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, precio_cobrado, precio_total, estado, estado_pago, car_wash_id, car_washes!car_wash_id(nombre, stripe_account_id, stripe_onboarding_complete), services!service_id(nombre)')
    .eq('id', appointment_id)
    .eq('client_id', user.id)
    .single() as { data: any };

  if (!appointment) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
  }

  if (appointment.estado === 'cancelled') {
    return NextResponse.json({ error: 'La cita esta cancelada' }, { status: 400 });
  }

  if (appointment.estado_pago === 'pagado') {
    return NextResponse.json({ error: 'La cita ya fue pagada' }, { status: 400 });
  }

  const carWash = appointment.car_washes;
  if (!carWash?.stripe_account_id || !carWash.stripe_onboarding_complete) {
    return NextResponse.json({ error: 'Este autolavado no acepta pagos en linea' }, { status: 400 });
  }

  const totalAmount = (appointment.precio_total ?? appointment.precio_cobrado) * 100;
  const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENT / 100);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    currency: 'mxn',
    line_items: [
      {
        price_data: {
          currency: 'mxn',
          product_data: {
            name: `${appointment.services?.nombre ?? 'Servicio'} en ${carWash.nombre}`,
          },
          unit_amount: totalAmount,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: {
        destination: carWash.stripe_account_id,
      },
    },
    metadata: {
      appointment_id: appointment.id,
    },
    success_url: `${appUrl}/mis-citas?payment=success`,
    cancel_url: `${appUrl}/mis-citas?payment=cancelled`,
  });

  await supabase
    .from('appointments')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', appointment.id);

  return NextResponse.json({ url: session.url });
}
