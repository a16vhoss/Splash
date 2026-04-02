import Link from 'next/link';

export default function SuperLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top navigation bar */}
      <nav className="flex items-center gap-8 bg-foreground px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-background">Splash</span>
          <span className="text-xs font-semibold text-primary-light">Super Admin</span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/super/negocios"
            className="text-sm font-medium text-background/70 transition-colors hover:text-background"
          >
            Negocios
          </Link>
          <Link
            href="/super/metricas"
            className="text-sm font-medium text-background/70 transition-colors hover:text-background"
          >
            Metricas
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 bg-background p-6">{children}</main>
    </div>
  );
}
