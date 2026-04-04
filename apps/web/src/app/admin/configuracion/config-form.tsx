'use client';

import { useState, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/toast';
import { LocationPicker } from '@/components/location-picker';
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
    stripe_account_id: string | null;
    stripe_onboarding_complete: boolean;
  };
}

export function ConfigForm({ carWash }: ConfigFormProps) {
  const [isPending, startTransition] = useTransition();
  const [connectingStripe, setConnectingStripe] = useState(false);
  const searchParams = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    const stripeStatus = searchParams.get('stripe');
    if (stripeStatus === 'success') toast('Cuenta de Stripe conectada exitosamente');
    if (stripeStatus === 'incomplete') toast('Registro de Stripe incompleto. Intenta de nuevo.', 'error');
    if (stripeStatus === 'error') toast('Error al conectar con Stripe', 'error');
  }, []);

  async function handleStripeConnect() {
    setConnectingStripe(true);
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast(data.error ?? 'Error al conectar con Stripe', 'error');
        setConnectingStripe(false);
      }
    } catch {
      toast('Error al conectar con Stripe', 'error');
      setConnectingStripe(false);
    }
  }

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
      {/* Stripe Connect */}
      <section className="rounded-card bg-card p-6 shadow-card">
        <h3 className="text-base font-semibold text-foreground mb-4">Pagos en linea</h3>
        {carWash.stripe_onboarding_complete ? (
          <div className="flex items-center gap-2">
            <span className="rounded-pill bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">Conectado</span>
            <span className="text-sm text-muted-foreground">Tu cuenta de Stripe esta activa para recibir pagos en linea.</span>
          </div>
        ) : carWash.stripe_account_id ? (
          <div>
            <p className="text-sm text-warning font-semibold mb-3">Onboarding incompleto. Completa tu registro en Stripe.</p>
            <button
              type="button"
              onClick={handleStripeConnect}
              disabled={connectingStripe}
              className="rounded-card bg-[#635BFF] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {connectingStripe ? 'Redirigiendo...' : 'Completar registro en Stripe'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-3">Conecta tu cuenta de Stripe para aceptar pagos con tarjeta en linea. Recibiras los pagos directamente en tu cuenta.</p>
            <button
              type="button"
              onClick={handleStripeConnect}
              disabled={connectingStripe}
              className="rounded-card bg-[#635BFF] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {connectingStripe ? 'Redirigiendo...' : 'Conectar con Stripe'}
            </button>
          </div>
        )}
      </section>

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
        <LocationPicker defaultLat={carWash.latitud} defaultLng={carWash.longitud} />
      </section>

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="rounded-input bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60">
          {isPending ? 'Guardando...' : 'Guardar configuracion'}
        </button>
      </div>
    </form>
  );
}
