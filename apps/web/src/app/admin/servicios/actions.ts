'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { serviceSchema } from '@splash/shared';

export async function createService(formData: FormData) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!carWash) throw new Error('No se encontro el autolavado');

  const raw = {
    nombre: formData.get('nombre') as string,
    descripcion: (formData.get('descripcion') as string) || null,
    precio: parseFloat(formData.get('precio') as string),
    duracion_min: parseInt(formData.get('duracion_min') as string, 10),
    categoria: (formData.get('categoria') as string) || 'lavado',
    activo: true,
  };

  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(', '));
  }

  await supabase.from('services').insert({
    ...parsed.data,
    car_wash_id: carWash.id,
    orden: 0,
  });

  revalidatePath('/servicios');
}

export async function deleteService(serviceId: string) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  await supabase.from('services').delete().eq('id', serviceId);

  revalidatePath('/servicios');
}

export async function toggleService(serviceId: string, activo: boolean) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  await supabase.from('services').update({ activo }).eq('id', serviceId);

  revalidatePath('/servicios');
}

export async function saveBusinessHours(formData: FormData) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!carWash) throw new Error('No se encontro el autolavado');

  for (let dia = 0; dia < 7; dia++) {
    const cerrado = formData.get(`cerrado_${dia}`) === 'on';
    const hora_apertura = formData.get(`apertura_${dia}`) as string || '09:00';
    const hora_cierre = formData.get(`cierre_${dia}`) as string || '18:00';

    await supabase
      .from('business_hours')
      .upsert(
        {
          car_wash_id: carWash.id,
          dia_semana: dia,
          hora_apertura,
          hora_cierre,
          cerrado,
        },
        { onConflict: 'car_wash_id,dia_semana' }
      );
  }

  revalidatePath('/servicios');
}
