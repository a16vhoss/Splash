import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === '/login';
  const isAdminPath = pathname.startsWith('/admin');
  const isSuperPath = pathname.startsWith('/super');

  // No user → redirect to /login (unless already there)
  if (!user) {
    if (!isLoginPage) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // Fetch role from users table
  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = userRecord?.role as string | undefined;

  // User on /login → redirect based on role
  if (isLoginPage) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = role === 'super_admin' ? '/super/metricas' : '/admin/dashboard';
    return NextResponse.redirect(dashboardUrl);
  }

  // Client role trying to access /admin or /super → redirect to /login
  if (role === 'client' && (isAdminPath || isSuperPath)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // wash_admin trying to access /super → redirect to /admin/dashboard
  if (role === 'wash_admin' && isSuperPath) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/admin/dashboard';
    return NextResponse.redirect(dashboardUrl);
  }

  // wash_admin subscription checks on /admin routes
  if (role === 'wash_admin' && isAdminPath) {
    const isSubscriptionPage = pathname.startsWith('/admin/suscripcion');

    if (!isSubscriptionPage) {
      // Fetch subscription status and trial expiration from car_washes
      const { data: carWash } = await supabase
        .from('car_washes')
        .select('subscription_status, trial_ends_at')
        .eq('owner_id', user.id)
        .single();

      if (carWash) {
        const { subscription_status, trial_ends_at } = carWash;
        const isPastDueOrCancelled =
          subscription_status === 'past_due' || subscription_status === 'cancelled';

        const trialExpired =
          subscription_status === 'trialing' &&
          trial_ends_at &&
          new Date(trial_ends_at) < new Date();

        if (isPastDueOrCancelled || trialExpired) {
          const suscripcionUrl = request.nextUrl.clone();
          suscripcionUrl.pathname = '/admin/suscripcion';
          return NextResponse.redirect(suscripcionUrl);
        }
      }
    }
  }

  return response;
}
