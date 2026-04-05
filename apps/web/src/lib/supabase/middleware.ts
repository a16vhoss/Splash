import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/autolavados', '/login', '/reset-password'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/autolavados/')) return true;
  if (pathname.startsWith('/api/')) return true;
  return false;
}

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

  // Public paths: allow without auth
  if (!user && isPublicPath(pathname)) {
    return response;
  }

  // No user on protected path: redirect to login
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // Fetch role
  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = userRecord?.role as string | undefined;

  // Logged-in user on /login: redirect based on role
  if (pathname === '/login') {
    const url = request.nextUrl.clone();
    if (role === 'super_admin') url.pathname = '/super/metricas';
    else if (role === 'wash_admin') url.pathname = '/admin/dashboard';
    else url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Client on admin/super paths: block
  if (role === 'client' && (pathname.startsWith('/admin') || pathname.startsWith('/super'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // wash_admin on super paths: block
  if (role === 'wash_admin' && pathname.startsWith('/super')) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/dashboard';
    return NextResponse.redirect(url);
  }

  // wash_admin subscription check on admin paths
  if (role === 'wash_admin' && pathname.startsWith('/admin') && !pathname.startsWith('/admin/suscripcion')) {
    const selectedId = request.cookies.get('selected_car_wash_id')?.value;

    // Build query for the selected car wash, or fallback to first owned
    let carWashQuery = supabase
      .from('car_washes')
      .select('subscription_status, trial_ends_at')
      .eq('owner_id', user.id);

    if (selectedId) {
      carWashQuery = carWashQuery.eq('id', selectedId);
    } else {
      carWashQuery = carWashQuery.order('created_at', { ascending: true }).limit(1);
    }

    const { data: carWash } = await carWashQuery.single();

    if (carWash) {
      const { subscription_status, trial_ends_at } = carWash;
      const expired = subscription_status === 'past_due' || subscription_status === 'cancelled' ||
        (subscription_status === 'trial' && trial_ends_at && new Date(trial_ends_at) < new Date());

      if (expired) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/suscripcion';
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}
