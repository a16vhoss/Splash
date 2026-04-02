'use client';

import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/citas': 'Citas',
  '/admin/servicios': 'Servicios',
  '/admin/reportes': 'Reportes',
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  for (const [key, value] of Object.entries(pageTitles)) {
    if (pathname.startsWith(key + '/')) return value;
  }
  return 'Panel Admin';
}

export function Topbar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-lg font-bold text-foreground">{title}</h1>
      <button
        type="button"
        aria-label="Notificaciones"
        className="flex h-9 w-9 items-center justify-center rounded-card text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>
    </header>
  );
}
