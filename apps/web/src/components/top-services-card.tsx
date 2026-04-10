import Link from 'next/link';

interface TopService {
  serviceName: string;
  units: number;
  revenue: number;
  pctOfUnits: number;
}

interface TopServicesCardProps {
  services: TopService[];
}

function formatMxn(n: number): string {
  return `$${Math.round(n).toLocaleString('es-MX')}`;
}

export function TopServicesCard({ services }: TopServicesCardProps) {
  return (
    <div className="rounded-card bg-card shadow-card">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-sm font-semibold text-foreground">Top servicios del mes</h3>
      </div>
      {services.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-muted-foreground">
          Aún no hay servicios registrados este mes
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {services.map((svc, i) => (
            <li key={svc.serviceName} className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground">{i + 1}.</span>
                <span className="text-sm font-semibold text-foreground">{svc.serviceName}</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">{svc.units} ({svc.pctOfUnits}%)</span>
                <span className="font-semibold text-accent">{formatMxn(svc.revenue)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-border px-6 py-3">
        <Link href="/admin/reportes" className="text-xs font-semibold text-primary hover:underline">
          Ver detalle completo →
        </Link>
      </div>
    </div>
  );
}
