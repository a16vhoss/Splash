'use server';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { loginSchema } from '@splash/shared';

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
