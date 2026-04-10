'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ServiceRow {
  serviceId: string;
  serviceName: string;
  units: number;
  revenue: number;
  avgTicket: number;
  pctOfUnits: number;
}

interface ServiceBreakdownTableProps {
  services: ServiceRow[];
}

type SortKey = 'serviceName' | 'units' | 'revenue' | 'avgTicket' | 'pctOfUnits';
type SortDir = 'asc' | 'desc';

function formatMxn(n: number): string {
  return `$${Math.round(n).toLocaleString('es-MX')}`;
}

export function ServiceBreakdownTable({ services }: ServiceBreakdownTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('units');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const copy = [...services];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return copy;
  }, [services, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const headers: Array<{ key: SortKey; label: string; align: 'left' | 'right' }> = [
    { key: 'serviceName', label: 'Servicio', align: 'left' },
    { key: 'units', label: 'Unidades', align: 'right' },
    { key: 'revenue', label: 'Ingresos', align: 'right' },
    { key: 'avgTicket', label: 'Ticket prom.', align: 'right' },
    { key: 'pctOfUnits', label: '%', align: 'right' },
  ];

  if (services.length === 0) {
    return (
      <div className="rounded-modal border border-border bg-white p-5">
        <h3 className="mb-4 text-sm font-bold text-foreground">Desglose por servicio</h3>
        <p className="text-xs text-muted-foreground">Sin datos</p>
      </div>
    );
  }

  return (
    <div className="rounded-modal border border-border bg-white p-5">
      <h3 className="mb-4 text-sm font-bold text-foreground">Desglose por servicio</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {headers.map((h) => (
                <th
                  key={h.key}
                  className={cn(
                    'cursor-pointer select-none px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground',
                    h.align === 'right' && 'text-right'
                  )}
                  onClick={() => toggleSort(h.key)}
                >
                  {h.label}
                  {sortKey === h.key && (
                    <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((svc) => (
              <tr key={svc.serviceId || svc.serviceName} className="border-b border-border last:border-0">
                <td className="px-3 py-2 font-medium text-foreground">{svc.serviceName}</td>
                <td className="px-3 py-2 text-right text-foreground">{svc.units.toLocaleString('es-MX')}</td>
                <td className="px-3 py-2 text-right font-semibold text-accent">{formatMxn(svc.revenue)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{formatMxn(svc.avgTicket)}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{svc.pctOfUnits}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
