import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { AdminTabBar } from '@/components/admin-tab-bar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <AdminTabBar />
    </div>
  );
}
