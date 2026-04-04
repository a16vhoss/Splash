import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const carWashId = searchParams.get('car_wash_id');

  if (!carWashId) {
    return NextResponse.json({ error: 'car_wash_id requerido' }, { status: 400 });
  }

  // Get messages grouped by conversation (unique sender/receiver pairs)
  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:users!sender_id(nombre), receiver:users!receiver_id(nombre)')
    .eq('car_wash_id', carWashId)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { car_wash_id, receiver_id, contenido, appointment_id } = await request.json();

  if (!car_wash_id || !receiver_id || !contenido?.trim()) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      car_wash_id,
      sender_id: user.id,
      receiver_id,
      contenido: contenido.trim(),
      appointment_id: appointment_id || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
  }

  // Create notification for receiver
  await supabase.from('notifications').insert({
    user_id: receiver_id,
    tipo: 'message',
    titulo: 'Nuevo mensaje',
    mensaje: contenido.trim().substring(0, 100),
    link: `/mis-citas`,
  });

  return NextResponse.json({ message });
}
