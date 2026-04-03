'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';

export async function saveConfig(formData: FormData) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!carWash) throw new Error('No se encontro el autolavado');

  const metodos_pago = formData.getAll('metodos_pago') as string[];
  const whatsapp = (formData.get('whatsapp') as string) || null;
  const latitud = formData.get('latitud') ? parseFloat(formData.get('latitud') as string) : null;
  const longitud = formData.get('longitud') ? parseFloat(formData.get('longitud') as string) : null;

  await supabase
    .from('car_washes')
    .update({
      metodos_pago: metodos_pago.length > 0 ? metodos_pago : ['efectivo'],
      whatsapp,
      latitud,
      longitud,
    })
    .eq('id', carWash.id);

  revalidatePath('/admin/configuracion');
}
