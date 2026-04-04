import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

interface CapacityEntry {
  dia_semana: number;
  hora: string;
  capacidad: number;
}

interface SlotConfigBody {
  car_wash_id: string;
  slot_duration_min: number;
  capacities: CapacityEntry[];
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  // 1. Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // 2. Parse body
  let body: SlotConfigBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const { car_wash_id, slot_duration_min, capacities } = body;

  if (!car_wash_id || !slot_duration_min || !Array.isArray(capacities)) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 422 });
  }

  // 3. Verify ownership
  const { data: carWash, error: cwError } = await supabase
    .from('car_washes')
    .select('id')
    .eq('id', car_wash_id)
    .eq('owner_id', user.id)
    .single();

  if (cwError || !carWash) {
    return NextResponse.json({ error: 'Autolavado no encontrado o sin permiso' }, { status: 403 });
  }

  // 4. Update slot_duration_min
  const { error: updateError } = await supabase
    .from('car_washes')
    .update({ slot_duration_min })
    .eq('id', car_wash_id);

  if (updateError) {
    console.error('Error updating slot_duration_min:', updateError);
    return NextResponse.json({ error: 'Error al actualizar duracion de turno' }, { status: 500 });
  }

  // 5. Delete existing slot_capacities
  const { error: deleteError } = await supabase
    .from('slot_capacities')
    .delete()
    .eq('car_wash_id', car_wash_id);

  if (deleteError) {
    console.error('Error deleting slot_capacities:', deleteError);
    return NextResponse.json({ error: 'Error al limpiar capacidades anteriores' }, { status: 500 });
  }

  // 6. Insert new capacities (append :00 to hora for TIME format)
  if (capacities.length > 0) {
    const rows = capacities.map((c) => ({
      car_wash_id,
      dia_semana: c.dia_semana,
      hora: c.hora.length === 5 ? `${c.hora}:00` : c.hora,
      capacidad: c.capacidad,
    }));

    const { error: insertError } = await supabase
      .from('slot_capacities')
      .insert(rows);

    if (insertError) {
      console.error('Error inserting slot_capacities:', insertError);
      return NextResponse.json({ error: 'Error al guardar capacidades' }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
