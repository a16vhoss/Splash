'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/components/toast';
import { updateEstaciones } from './actions';

export function StationManager({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleAdd() {
    const newCount = count + 1;
    setCount(newCount);
    save(newCount);
  }

  function handleRemove(_index: number) {
    if (count <= 1) return;
    const newCount = count - 1;
    setCount(newCount);
    save(newCount);
  }

  function save(newCount: number) {
    startTransition(async () => {
      try {
        await updateEstaciones(newCount);
        toast('Estaciones actualizadas');
      } catch (e: any) {
        toast(e.message ?? 'Error al actualizar', 'error');
        setCount(count); // revert
      }
    });
  }

  return (
    <div className="rounded-card bg-card p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Total de estaciones:{' '}
            <span className="font-semibold text-foreground">{count}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {editing ? 'Listo' : 'Editar'}
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending}
            className="flex items-center gap-1 rounded-card bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar
          </button>
        </div>
      </div>

      {count > 0 ? (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: count }, (_, i) => (
            <div
              key={i}
              className="relative flex h-16 w-16 flex-col items-center justify-center rounded-card border-2 border-primary bg-primary/5 group"
            >
              <span className="text-xs font-bold text-primary">E{i + 1}</span>
              {editing && count > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  disabled={isPending}
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600 transition-colors shadow-sm"
                  title={`Eliminar estación ${i + 1}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No hay estaciones configuradas</p>
      )}

      {editing && (
        <p className="mt-3 text-xs text-muted-foreground">
          Haz clic en la × roja para eliminar una estación. Siempre debe haber al menos una.
        </p>
      )}
    </div>
  );
}
