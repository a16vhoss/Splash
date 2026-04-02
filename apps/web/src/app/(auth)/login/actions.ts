'use server';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { loginSchema } from '@splash/shared';
import { TRIAL_DAYS } from '@splash/shared';

export async function loginAction(formData: FormData) {
  const supabase = await createServerSupabase();
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: 'Email o password incorrectos' };
  redirect('/admin/dashboard');
}

export async function registerAction(formData: FormData) {
  const supabase = await createServerSupabase();

  const nombre = formData.get('nombre') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const nombreNegocio = formData.get('nombre_negocio') as string;
  const direccion = formData.get('direccion') as string;

  if (!nombre || nombre.length < 2) return { error: 'Nombre muy corto' };
  if (!email) return { error: 'Email requerido' };
  if (!password || password.length < 8) return { error: 'Password: minimo 8 caracteres' };
  if (!nombreNegocio || nombreNegocio.length < 2) return { error: 'Nombre del negocio requerido' };
  if (!direccion) return { error: 'Direccion requerida' };

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) return { error: authError.message };
  if (!authData.user) return { error: 'Error al crear cuenta' };

  // Create user profile
  const { error: userError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    nombre,
    role: 'wash_admin',
  });
  if (userError) return { error: userError.message };

  // Create car wash
  const slug = nombreNegocio.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: cwError } = await supabase.from('car_washes').insert({
    owner_id: authData.user.id,
    nombre: nombreNegocio,
    slug: slug + '-' + Date.now().toString(36),
    direccion,
    latitud: 19.4326,
    longitud: -99.1332,
    subscription_status: 'trial',
    trial_ends_at: trialEndsAt,
  });
  if (cwError) return { error: cwError.message };

  redirect('/admin/dashboard');
}

export async function registerClientAction(formData: FormData) {
  const supabase = await createServerSupabase();

  const nombre = formData.get('nombre') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!nombre || nombre.length < 2) return { error: 'Nombre muy corto' };
  if (!email) return { error: 'Email requerido' };
  if (!password || password.length < 8) return { error: 'Password: minimo 8 caracteres' };

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) return { error: authError.message };
  if (!authData.user) return { error: 'Error al crear cuenta' };

  // Create user profile with client role
  const { error: userError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    nombre,
    role: 'client',
  });
  if (userError) return { error: userError.message };

  redirect('/');
}
