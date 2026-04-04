export const dynamic = 'force-dynamic';

import { getAdminCarWash } from '@/lib/admin-car-wash';
import { createServerSupabase } from '@/lib/supabase/server';
import { ConfigForm } from './config-form';
import { SlotConfig } from '@/components/slot-config';

export default async function ConfiguracionPage() {
  const carWash = await getAdminCarWash('id, metodos_pago, whatsapp, latitud, longitud, stripe_account_id, stripe_onboarding_complete, slot_duration_min') as any;

  if (!carWash) return <p className="text-muted-foreground">No se encontro tu autolavado.</p>;

  const supabase = await createServerSupabase();

  const [{ data: businessHours }, { data: slotCapacities }] = await Promise.all([
    supabase
      .from('business_hours')
      .select('dia_semana, hora_apertura, hora_cierre, cerrado')
      .eq('car_wash_id', carWash.id)
      .order('dia_semana', { ascending: true }),
    supabase
      .from('slot_capacities')
      .select('dia_semana, hora, capacidad')
      .eq('car_wash_id', carWash.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configuracion</h2>
        <p className="mt-1 text-sm text-muted-foreground">Configura tu autolavado</p>
      </div>
      <SlotConfig
        carWashId={carWash.id}
        slotDurationMin={carWash.slot_duration_min ?? 60}
        businessHours={businessHours ?? []}
        initialCapacities={slotCapacities ?? []}
      />
      <ConfigForm carWash={carWash} />
    </div>
  );
}
