import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { car_wash_id, plan } = session.metadata ?? {};

      if (!car_wash_id || !plan) break;

      // Retrieve full subscription details
      let subscription: Stripe.Subscription | null = null;
      if (session.subscription) {
        subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      }

      // Stripe v21: billing cycle info lives on subscription.billing_cycle_anchor
      // and items[0].period for period start/end
      const subItem = subscription?.items?.data?.[0];
      await supabase.from('subscriptions').upsert({
        car_wash_id,
        stripe_subscription_id: subscription?.id ?? null,
        stripe_customer_id: session.customer as string ?? null,
        plan,
        status: 'active',
        current_period_start: subItem?.created
          ? new Date(subItem.created * 1000).toISOString()
          : null,
        current_period_end: subscription?.billing_cycle_anchor
          ? new Date((subscription.billing_cycle_anchor as number) * 1000).toISOString()
          : null,
      }, { onConflict: 'car_wash_id' });

      await supabase
        .from('car_washes')
        .update({ subscription_status: 'active' })
        .eq('id', car_wash_id);

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
      const stripeSubscriptionId = invoice.subscription ?? null;

      if (!stripeSubscriptionId) break;

      await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', stripeSubscriptionId);

      // Get car_wash_id to update car_washes table
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('car_wash_id')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .single();

      if (sub?.car_wash_id) {
        await supabase
          .from('car_washes')
          .update({ subscription_status: 'past_due' })
          .eq('id', sub.car_wash_id);
      }

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('stripe_subscription_id', subscription.id);

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('car_wash_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (sub?.car_wash_id) {
        await supabase
          .from('car_washes')
          .update({ subscription_status: 'cancelled' })
          .eq('id', sub.car_wash_id);
      }

      break;
    }

    default:
      // Unhandled event type — ignore
      break;
  }

  return NextResponse.json({ received: true });
}
