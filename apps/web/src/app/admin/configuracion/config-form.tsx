'use client';

import { useTransition } from 'react';
import { useToast } from '@/components/toast';
import { saveConfig } from './actions';

const METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta_sitio', label: 'Tarjeta en sitio' },
  { value: 'transferencia', label: 'Transferencia bancaria' },
];

interface ConfigFormProps {
  carWash: {
    id: string;
    metodos_pago: string[] | null;
    whatsapp: string | null;
    latitud: number | null;
    longitud: number | null;
  };
}

export function ConfigForm({ carWash }: ConfigFormProps) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await saveConfig(formData);
        toast('Configuracion guardada');
      } catch {
        toast('Error al guardar', 'error');
      }
    });
  }

  const currentMethods = carWash.metodos_pago ?? ['efectivo'];

  return (
    <form action={handleSubmit} className="space-y-6">
      <section className="rounded-card bg-card p-6 shadow-card">
        <h3 className="text-base font-semibold text-foreground mb-4">Metodos de pago aceptados</h3>
        <div className="space-y-3">
          {METHODS.map((method) => (
            <label key={method.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="metodos_pago"
                value={method.value}
                defaultChecked={currentMethods.includes(method.value)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <span className="text-sm font-medium text-foreground">{method.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-card bg-card p-6 shadow-card">
        <h3 className="text-base font-semibold text-foreground mb-4">WhatsApp</h3>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Numero con codigo de pais (ej: 5213312345678)</label>
          <input
            name="whatsapp"
            type="tel"
            defaultValue={carWash.whatsapp ?? ''}
            placeholder="5213312345678"
            className="w-full max-w-sm rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </section>

      <section className="rounded-card bg-card p-6 shadow-card">
        <h3 className="text-base font-semibold text-foreground mb-4">Ubicacion</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-sm">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Latitud</label>
            <input name="latitud" type="number" step="0.0000001" defaultValue={carWash.latitud ?? ''} placeholder="20.6597" className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Longitud</label>
            <input name="longitud" type="number" step="0.0000001" defaultValue={carWash.longitud ?? ''} placeholder="-103.3496" className="w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="rounded-input bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60">
          {isPending ? 'Guardando...' : 'Guardar configuracion'}
        </button>
      </div>
    </form>
  );
}
