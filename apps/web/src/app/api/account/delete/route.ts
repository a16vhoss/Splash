import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function DELETE() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  // Get user role
  const { data: userRecord } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userRecord) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  try {
    if (userRecord.role === 'wash_admin') {
      // Get all car washes owned by this admin
      const { data: carWashes } = await admin
        .from('car_washes')
        .select('id')
        .eq('owner_id', user.id);

      const carWashIds = (carWashes ?? []).map((cw: any) => cw.id);

      if (carWashIds.length > 0) {
        // Delete all data related to car washes
        await admin.from('messages').delete().in('car_wash_id', carWashIds);
        await admin.from('loyalty_cards').delete().in('car_wash_id', carWashIds);
        await admin.from('availability_alerts').delete().in('car_wash_id', carWashIds);
        await admin.from('favorites').delete().in('car_wash_id', carWashIds);
        await admin.from('slot_capacities').delete().in('car_wash_id', carWashIds);

        // Delete reviews for appointments at these car washes
        const { data: appointments } = await admin
          .from('appointments')
          .select('id')
          .in('car_wash_id', carWashIds);
        const appointmentIds = (appointments ?? []).map((a: any) => a.id);
        if (appointmentIds.length > 0) {
          await admin.from('reviews').delete().in('appointment_id', appointmentIds);
        }

        await admin.from('appointments').delete().in('car_wash_id', carWashIds);
        await admin.from('services').delete().in('car_wash_id', carWashIds);
        await admin.from('business_hours').delete().in('car_wash_id', carWashIds);
        await admin.from('car_washes').delete().in('id', carWashIds);
      }
    }

    if (userRecord.role === 'client') {
      // Delete client-specific data
      await admin.from('messages').delete().eq('sender_id', user.id);
      await admin.from('favorites').delete().eq('user_id', user.id);
      await admin.from('availability_alerts').delete().eq('user_id', user.id);
      await admin.from('loyalty_cards').delete().eq('user_id', user.id);
      await admin.from('reviews').delete().eq('client_id', user.id);
      await admin.from('appointments').delete().eq('client_id', user.id);
    }

    // Delete notifications and user record (common for both roles)
    await admin.from('notifications').delete().eq('user_id', user.id);
    await admin.from('users').delete().eq('id', user.id);

    // Delete auth user
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return NextResponse.json({ error: 'Error al eliminar cuenta de autenticación' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error al eliminar cuenta' }, { status: 500 });
  }
}
