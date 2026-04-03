'use client';

import { useTransition } from 'react';
import { useToast } from '@/components/toast';
import { saveBusinessHours } from './actions';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

interface HoursFormProps {
  hoursByDay: Record<number, { hora_apertura?: string; hora_cierre?: string; cerrado?: boolean }>;
}

export function HoursForm({ hoursByDay }: HoursFormProps) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await saveBusinessHours(formData);
        toast('Horarios guardados correctamente');
      } catch {
        toast('Error al guardar horarios', 'error');
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Dia</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Apertura</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Cierre</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Cerrado</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, i) => {
              const bh = hoursByDay[i];
              return (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-6 py-3 font-medium text-foreground">{day}</td>
                  <td className="px-6 py-3">
                    <input
                      type="time"
                      name={`apertura_${i}`}
                      defaultValue={bh?.hora_apertura?.slice(0, 5) ?? '09:00'}
                      className="rounded-input border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="time"
                      name={`cierre_${i}`}
                      defaultValue={bh?.hora_cierre?.slice(0, 5) ?? '18:00'}
                      className="rounded-input border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="checkbox"
                      name={`cerrado_${i}`}
                      defaultChecked={bh?.cerrado ?? false}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end px-6 pb-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-input bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        >
          {isPending ? 'Guardando...' : 'Guardar horarios'}
        </button>
      </div>
    </form>
  );
}
