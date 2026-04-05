'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getAdminCarWash } from '@/lib/admin-car-wash';

export async function completeAppointment(appointmentId: string) {
  const supabase = await createServerSupabase();

  const carWash = await getAdminCarWash('id, nombre, owner_id');
  if (!carWash) throw new Error('No se encontro el autolavado');

  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, estado, client_id, fecha, hora_inicio')
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

  // Create notifications for both client and admin
  const notifications = [
    {
      user_id: appointment.client_id,
      appointment_id: appointmentId,
      tipo: 'confirmation' as const,
      titulo: 'Cita completada',
      mensaje: `Tu cita del ${appointment.fecha} a las ${appointment.hora_inicio?.slice(0, 5)} en ${carWash.nombre} ha sido completada.`,
      leida: false,
    },
    {
      user_id: carWash.owner_id,
      appointment_id: appointmentId,
      tipo: 'confirmation' as const,
      titulo: 'Cita completada',
      mensaje: `Cita del ${appointment.fecha} a las ${appointment.hora_inicio?.slice(0, 5)} marcada como completada.`,
      leida: false,
    },
  ];

  await supabase.from('notifications').insert(notifications);

  revalidatePath('/admin/citas');
  revalidatePath('/admin/dashboard');
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
