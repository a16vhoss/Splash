'use client';

import { cn } from '@/lib/utils';

export type GroupBy = 'day' | 'week' | 'month';

interface PeriodToggleProps {
  value: GroupBy;
  onChange: (value: GroupBy) => void;
}

const OPTIONS: Array<{ value: GroupBy; label: string }> = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
];

export function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  return (
    <div className="inline-flex rounded-pill border border-border bg-white p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1 text-xs font-semibold rounded-pill transition-colors',
            value === opt.value
              ? 'bg-primary text-white'
              : 'text-foreground hover:bg-muted'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
