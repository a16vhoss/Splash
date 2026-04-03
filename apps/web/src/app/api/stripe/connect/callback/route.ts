import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get('account_id');
  if (!accountId) return NextResponse.redirect(new URL('/admin/configuracion?stripe=error', req.url));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const account = await stripe.accounts.retrieve(accountId);
  const isComplete = account.charges_enabled && account.payouts_enabled;

  await supabase
    .from('car_washes')
    .update({ stripe_onboarding_complete: isComplete })
    .eq('stripe_account_id', accountId);

  if (isComplete) {
    const { data: carWash } = await supabase
      .from('car_washes')
      .select('metodos_pago')
      .eq('stripe_account_id', accountId)
      .single();

    const methods = carWash?.metodos_pago ?? ['efectivo'];
    if (!methods.includes('pago_en_linea')) {
      methods.push('pago_en_linea');
      await supabase
        .from('car_washes')
        .update({ metodos_pago: methods })
        .eq('stripe_account_id', accountId);
    }
  }

  const redirectUrl = isComplete
    ? '/admin/configuracion?stripe=success'
    : '/admin/configuracion?stripe=incomplete';

  return NextResponse.redirect(new URL(redirectUrl, req.url));
}
