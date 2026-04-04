export const dynamic = 'force-dynamic';

import { getAdminCarWash } from '@/lib/admin-car-wash';
import { ConfigForm } from './config-form';

export default async function ConfiguracionPage() {
  const carWash = await getAdminCarWash('id, metodos_pago, whatsapp, latitud, longitud, stripe_account_id, stripe_onboarding_complete') as any;

  if (!carWash) return <p className="text-muted-foreground">No se encontro tu autolavado.</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configuracion</h2>
        <p className="mt-1 text-sm text-muted-foreground">Configura tu autolavado</p>
      </div>
      <ConfigForm carWash={carWash} />
    </div>
  );
}
