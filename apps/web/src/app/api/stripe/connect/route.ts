import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe no esta configurado' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const carWashId = body.car_wash_id;

  let query = supabase
    .from('car_washes')
    .select('id, stripe_account_id, nombre')
    .eq('owner_id', user.id);

  if (carWashId) {
    query = query.eq('id', carWashId);
  } else {
    query = query.order('created_at', { ascending: true }).limit(1);
  }

  const { data: carWash } = await query.single();

  if (!carWash) return NextResponse.json({ error: 'No se encontro el autolavado' }, { status: 404 });

  let accountId = carWash.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'MX',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: carWash.nombre,
      },
    });

    accountId = account.id;

    await supabase
      .from('car_washes')
      .update({ stripe_account_id: accountId })
      .eq('id', carWash.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/admin/configuracion?stripe=refresh`,
    return_url: `${appUrl}/api/stripe/connect/callback?account_id=${accountId}`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: accountLink.url });
}
