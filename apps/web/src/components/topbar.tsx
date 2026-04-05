'use client';

import { usePathname } from 'next/navigation';
import { BusinessSwitcher } from './business-switcher';
import { NotificationBell } from './notification-bell';

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/citas': 'Citas',
  '/admin/servicios': 'Servicios',
  '/admin/reportes': 'Reportes',
  '/admin/configuracion': 'Configuracion',
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  for (const [key, value] of Object.entries(pageTitles)) {
    if (pathname.startsWith(key + '/')) return value;
  }
  return 'Panel Admin';
}

interface TopbarProps {
  carWashes?: { id: string; nombre: string; subscription_status: string | null }[];
  selectedCarWashId?: string | null;
}

export function Topbar({ carWashes, selectedCarWashId }: TopbarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
        {carWashes && carWashes.length > 0 && (
          <BusinessSwitcher carWashes={carWashes} selectedId={selectedCarWashId ?? null} />
        )}
      </div>
      <NotificationBell />
    </header>
  );
}
