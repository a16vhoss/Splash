export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AnalyticsDashboard } from './analytics-client';

export default async function ReportesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id, nombre')
    .eq('owner_id', user.id)
    .single();

  if (!carWash) redirect('/admin/dashboard');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-foreground">Reportes y Analiticas</h1>
      <AnalyticsDashboard carWashId={carWash.id} carWashName={carWash.nombre} />
    </div>
  );
}
