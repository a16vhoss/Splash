export const dynamic = 'force-dynamic';

import { getAdminCarWash } from '@/lib/admin-car-wash';
import { createServerSupabase } from '@/lib/supabase/server';
import { ConfigForm } from './config-form';
import { SlotConfig } from '@/components/slot-config';
import { DeleteAccount } from '@/components/delete-account';
import { AdminProfileSection } from './admin-profile';

export default async function ConfiguracionPage() {
  const carWash = await getAdminCarWash('id, num_estaciones, metodos_pago, whatsapp, latitud, longitud, stripe_account_id, stripe_onboarding_complete, slot_duration_min') as any;

  if (!carWash) return <p className="text-muted-foreground">No se encontro tu autolavado.</p>;

  const supabase = await createServerSupabase();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  let adminUser: any = null;
  if (authUser) {
    const { data } = await supabase.from('users').select('id, nombre, email, avatar_url').eq('id', authUser.id).single();
    adminUser = data;
  }

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
      {adminUser && (
        <AdminProfileSection user={adminUser} />
      )}
      <SlotConfig
        carWashId={carWash.id}
        slotDurationMin={carWash.slot_duration_min ?? 60}
        numEstaciones={carWash.num_estaciones ?? 1}
        businessHours={businessHours ?? []}
        initialCapacities={slotCapacities ?? []}
      />
      <ConfigForm carWash={carWash} />
      <DeleteAccount isAdmin />
    </div>
  );
}
