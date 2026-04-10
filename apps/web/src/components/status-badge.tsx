import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  confirmed: 'bg-primary/10 text-primary',
  in_progress: 'bg-warning/10 text-warning',
  completed: 'bg-accent/10 text-accent',
  rated: 'bg-accent/10 text-accent',
  cancelled: 'bg-destructive/10 text-destructive',
  no_show: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmada',
  in_progress: 'En progreso',
  completed: 'Completada',
  rated: 'Calificada',
  cancelled: 'Cancelada',
  no_show: 'Vencida',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('rounded-pill px-2.5 py-0.5 text-xs font-semibold', statusStyles[status] ?? 'bg-muted text-muted-foreground')}>
      {statusLabels[status] ?? status}
    </span>
  );
}
