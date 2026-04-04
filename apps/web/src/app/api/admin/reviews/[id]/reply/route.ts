import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  // Verify user is wash_admin
  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userRecord?.role !== 'wash_admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { respuesta } = await request.json();
  if (!respuesta?.trim()) {
    return NextResponse.json({ error: 'Respuesta requerida' }, { status: 400 });
  }

  // Verify the review belongs to one of the admin's car washes
  const { data: review } = await supabase
    .from('reviews')
    .select('car_wash_id, car_washes!inner(owner_id)')
    .eq('id', id)
    .single();

  if (!review || (review.car_washes as any)?.owner_id !== user.id) {
    return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 });
  }

  const { error } = await supabase
    .from('reviews')
    .update({
      respuesta_admin: respuesta.trim(),
      respuesta_fecha: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Error al responder' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
