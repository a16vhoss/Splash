'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Leaflet touches `window` at module load time, so we must defer loading until
// the client mounts. `next/dynamic` with `ssr: false` prevents SSR evaluation.
const LocationPicker = dynamic(
  () => import('./location-picker').then((m) => m.LocationPicker),
  { ssr: false }
);

interface NewBusinessModalProps {
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function NewBusinessModal({ onClose, onCreated }: NewBusinessModalProps) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const direccionRef = useRef<HTMLInputElement>(null);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const nombre = form.get('nombre') as string;
    const direccion = form.get('direccion') as string;
    const whatsapp = (form.get('whatsapp') as string) || null;
    const latitud = form.get('latitud') ? parseFloat(form.get('latitud') as string) : null;
    const longitud = form.get('longitud') ? parseFloat(form.get('longitud') as string) : null;

    try {
      const res = await fetch('/api/car-washes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, direccion, whatsapp, latitud, longitud }),
      });
      if (res.ok) {
        const data = await res.json();
        onCreated(data.id);
      } else {
        const data = await res.json();
        setError(data.error ?? 'Error al crear negocio');
      }
    } catch {
      setError('Error de conexion');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-card bg-card border border-border shadow-modal mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">Nuevo negocio</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Nombre del negocio</label>
            <input
              name="nombre"
              required
              placeholder="Ej: Mi Autolavado Express"
              className="w-full rounded-input border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Direccion</label>
            <input
              ref={direccionRef}
              name="direccion"
              required
              placeholder="Calle, numero, colonia, ciudad"
              className="w-full rounded-input border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">WhatsApp</label>
            <input
              name="whatsapp"
              type="tel"
              placeholder="5213312345678"
              className="w-full rounded-input border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">Numero con codigo de pais (opcional)</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Ubicacion</label>
            <LocationPicker
              defaultLat={null}
              defaultLng={null}
              height="200px"
              onAddressResolved={(address) => {
                if (direccionRef.current) {
                  direccionRef.current.value = address;
                }
              }}
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 rounded-input bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {creating ? 'Creando negocio...' : 'Crear negocio'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-input px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
