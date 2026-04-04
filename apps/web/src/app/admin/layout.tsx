import { cookies } from 'next/headers';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { AdminTabBar } from '@/components/admin-tab-bar';
import { getAdminCarWashes } from '@/lib/admin-car-wash';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const carWashes = await getAdminCarWashes();
  const cookieStore = await cookies();
  const selectedId = cookieStore.get('selected_car_wash_id')?.value ?? carWashes[0]?.id ?? null;
  const selected = carWashes.find((cw) => cw.id === selectedId) ?? carWashes[0];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        businessName={selected?.nombre}
        subscriptionStatus={selected?.subscription_status ?? undefined}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar carWashes={carWashes} selectedCarWashId={selectedId} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <AdminTabBar />
    </div>
  );
}
