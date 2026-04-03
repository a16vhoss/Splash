'use client';

import { useTransition } from 'react';
import { useToast } from '@/components/toast';
import { createService } from './actions';

export function ServiceForm() {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createService(formData);
        toast('Servicio creado');
      } catch (e: any) {
        toast(e.message ?? 'Error al crear servicio', 'error');
      }
    });
  }

  return (
    <form action={handleSubmit} className="rounded-card bg-card p-6 shadow-card">
      <p className="mb-4 text-sm font-semibold text-muted-foreground">Agregar servicio</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Nombre</label>
          <input
            name="nombre"
            required
            minLength={2}
            maxLength={150}
            placeholder="Lavado basico"
            className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Precio ($)</label>
          <input
            name="precio"
            type="number"
            required
            min={1}
            step="0.01"
            placeholder="150.00"
            className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Duracion (min)</label>
          <input
            name="duracion_min"
            type="number"
            required
            min={15}
            max={480}
            placeholder="30"
            className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Categoria</label>
          <select
            name="categoria"
            defaultValue="lavado"
            className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="lavado">Lavado</option>
            <option value="detailing">Detailing</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Descripcion (opcional)</label>
          <input
            name="descripcion"
            maxLength={1000}
            placeholder="Describe el servicio..."
            className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="es_complementario"
              className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-xs font-semibold text-muted-foreground">Es complementario (add-on)</span>
          </label>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-input bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        >
          {isPending ? 'Agregando...' : 'Agregar servicio'}
        </button>
      </div>
    </form>
  );
}
