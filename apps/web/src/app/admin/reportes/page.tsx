export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Sidebar } from '@/components/sidebar';
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
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <h1 className="text-2xl font-extrabold text-foreground mb-6">Reportes y Analiticas</h1>
          <AnalyticsDashboard carWashId={carWash.id} />
        </main>
      </div>
    </div>
  );
}
