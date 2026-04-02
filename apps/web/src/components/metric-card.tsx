import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
}

export function MetricCard({ title, value, subtitle, trend }: MetricCardProps) {
  return (
    <div className="rounded-card bg-card p-6 shadow-card">
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {trend && (
          <span className={cn('text-xs font-semibold', trend.positive ? 'text-accent' : 'text-destructive')}>
            {trend.positive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
