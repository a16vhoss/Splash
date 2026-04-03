'use client';

import Link from 'next/link';
import { downloadICS } from '@/lib/calendar';

const statusStyles: Record<string, string> = {
  confirmed: 'bg-primary/10 text-primary',
  in_progress: 'bg-warning/10 text-warning',
  completed: 'bg-accent/10 text-accent',
  cancelled: 'bg-destructive/10 text-destructive',
  no_show: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmada',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No show',
};

interface AppointmentCardProps {
  appointment: any;
  onCancel?: (id: string) => void;
}

export function AppointmentCard({ appointment, onCancel }: AppointmentCardProps) {
  const statusColor = statusStyles[appointment.estado] ?? 'bg-muted text-muted-foreground';

  return (
    <div className="rounded-card border border-border bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-foreground">{appointment.car_washes?.nombre ?? 'Autolavado'}</p>
          <p className="text-sm text-foreground mt-0.5">{appointment.services?.nombre ?? '-'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {appointment.fecha} &middot; {appointment.hora_inicio} &middot; ${Number(appointment.precio_cobrado).toLocaleString('es-MX')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}>
            {statusLabels[appointment.estado] ?? appointment.estado}
          </span>
          {appointment.metodo_pago === 'pago_en_linea' && (
            <span className={
              appointment.estado_pago === 'pagado'
                ? 'rounded-pill bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent'
                : appointment.estado_pago === 'reembolsado'
                  ? 'rounded-pill bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning'
                  : 'rounded-pill bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground'
            }>
              {appointment.estado_pago === 'pagado' ? 'Pagado en linea' : appointment.estado_pago === 'reembolsado' ? 'Reembolsado' : 'Pago pendiente'}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        {appointment.estado === 'completed' && (
          <Link
            href={`/calificar/${appointment.id}`}
            className="px-4 py-2 rounded-card bg-warning text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Calificar servicio
          </Link>
        )}
        {appointment.estado === 'confirmed' && onCancel && (
          <button
            onClick={() => onCancel(appointment.id)}
            className="px-4 py-2 rounded-card border border-destructive text-destructive text-sm font-semibold hover:bg-destructive/5 transition-colors"
          >
            Cancelar cita
          </button>
        )}
        {(appointment.estado === 'confirmed' || appointment.estado === 'in_progress') && (
          <button
            onClick={() => downloadICS({
              title: `Lavado en ${appointment.car_washes?.nombre ?? 'Autolavado'}`,
              date: appointment.fecha,
              startTime: appointment.hora_inicio?.slice(0, 5) ?? '09:00',
              durationMin: appointment.services?.duracion_min ?? 30,
              location: appointment.car_washes?.direccion ?? undefined,
              description: `Servicio: ${appointment.services?.nombre ?? ''}\nPrecio: $${appointment.precio_cobrado}`,
            })}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Agregar al calendario
          </button>
        )}
      </div>
    </div>
  );
}
