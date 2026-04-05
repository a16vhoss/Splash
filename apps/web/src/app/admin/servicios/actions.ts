'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminCarWash } from '@/lib/admin-car-wash';
import { serviceSchema } from '@splash/shared';

export async function createService(formData: FormData) {
  const supabase = await createServerSupabase();

  const carWash = await getAdminCarWash('id');
  if (!carWash) throw new Error('No se encontro el autolavado');

  const raw = {
    nombre: formData.get('nombre') as string,
    descripcion: (formData.get('descripcion') as string) || null,
    precio: parseFloat(formData.get('precio') as string),
    duracion_min: parseInt(formData.get('duracion_min') as string, 10),
    categoria: (formData.get('categoria') as string) || 'lavado',
    es_complementario: formData.get('es_complementario') === 'on',
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

  revalidatePath('/admin/servicios');
}

export async function deleteService(serviceId: string) {
  const supabase = await createServerSupabase();

  await supabase.from('services').delete().eq('id', serviceId);

  revalidatePath('/admin/servicios');
}

export async function toggleService(serviceId: string, activo: boolean) {
  const supabase = await createServerSupabase();

  await supabase.from('services').update({ activo }).eq('id', serviceId);

  revalidatePath('/admin/servicios');
}

export async function updateEstaciones(numEstaciones: number) {
  const supabase = await createServerSupabase();

  const carWash = await getAdminCarWash('id');
  if (!carWash) throw new Error('No se encontro el autolavado');

  if (numEstaciones < 1 || numEstaciones > 50) {
    throw new Error('El número de estaciones debe ser entre 1 y 50');
  }

  const { error } = await supabase
    .from('car_washes')
    .update({ num_estaciones: numEstaciones })
    .eq('id', carWash.id);

  if (error) throw new Error('Error al actualizar estaciones');

  revalidatePath('/admin/servicios');
}

export async function saveBusinessHours(formData: FormData) {
  const supabase = await createServerSupabase();

  const carWash = await getAdminCarWash('id');
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

  revalidatePath('/admin/servicios');
}
