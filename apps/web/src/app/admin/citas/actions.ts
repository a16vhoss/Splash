'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';

export async function completeAppointment(appointmentId: string) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (!carWash) throw new Error('No se encontro el autolavado');

  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, estado')
    .eq('id', appointmentId)
    .eq('car_wash_id', carWash.id)
    .single();

  if (!appointment) throw new Error('Cita no encontrada');
  if (appointment.estado !== 'confirmed' && appointment.estado !== 'in_progress') {
    throw new Error('Solo se pueden completar citas confirmadas o en progreso');
  }

  await supabase
    .from('appointments')
    .update({ estado: 'completed' })
    .eq('id', appointmentId);

  revalidatePath('/admin/citas');
}

export async function markAsPaid(appointmentId: string) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  await supabase
    .from('appointments')
    .update({ estado_pago: 'pagado' })
    .eq('id', appointmentId);

  revalidatePath('/admin/citas');
}
