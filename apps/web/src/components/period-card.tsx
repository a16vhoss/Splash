import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/sparkline';

interface PeriodCardProps {
  label: string;
  units: number;
  revenue: number;
  prevUnits: number;
  prevRevenue: number;
  sparkline: number[];
}

function formatDelta(current: number, previous: number): { text: string; positive: boolean } {
  if (previous === 0 && current === 0) return { text: '—', positive: true };
  if (previous === 0) return { text: 'Nuevo', positive: true };
  const pct = ((current - previous) / previous) * 100;
  return {
    text: `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(0)}%`,
    positive: pct >= 0,
  };
}

function formatMxn(n: number): string {
  return `$${Math.round(n).toLocaleString('es-MX')}`;
}

export function PeriodCard({
  label,
  units,
  revenue,
  prevUnits,
  prevRevenue,
  sparkline,
}: PeriodCardProps) {
  const unitsDelta = formatDelta(units, prevUnits);
  const revenueDelta = formatDelta(revenue, prevRevenue);

  return (
    <div className="rounded-card bg-card p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2">
        <p className="text-2xl font-bold text-foreground">
          {units.toLocaleString('es-MX')} <span className="text-sm font-medium text-muted-foreground">lav.</span>
        </p>
        <p className="mt-0.5 text-sm font-semibold text-accent">{formatMxn(revenue)}</p>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold">
        <span className={cn(unitsDelta.positive ? 'text-accent' : 'text-destructive')}>
          {unitsDelta.text} lav.
        </span>
        <span className={cn(revenueDelta.positive ? 'text-accent' : 'text-destructive')}>
          {revenueDelta.text} ingr.
        </span>
      </div>
      <div className="mt-3">
        <Sparkline data={sparkline} />
      </div>
    </div>
  );
}
