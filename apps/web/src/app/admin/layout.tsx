import { cookies } from 'next/headers';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { AdminTabBar } from '@/components/admin-tab-bar';
import { getAdminCarWashes } from '@/lib/admin-car-wash';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const carWashes = await getAdminCarWashes();
  const cookieStore = await cookies();
  const selectedId = cookieStore.get('selected_car_wash_id')?.value ?? carWashes[0]?.id ?? null;
  const selected = carWashes.find((cw) => cw.id === selectedId) ?? carWashes[0];

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  let avatarUrl: string | null = null;
  if (user) {
    const { data: userData } = await supabase.from('users').select('avatar_url').eq('id', user.id).single();
    avatarUrl = userData?.avatar_url ?? null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        businessName={selected?.nombre}
        subscriptionStatus={selected?.subscription_status ?? undefined}
        avatarUrl={avatarUrl}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar carWashes={carWashes} selectedCarWashId={selectedId} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <AdminTabBar />
    </div>
  );
}
