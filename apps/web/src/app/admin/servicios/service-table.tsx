'use client';

import { useTransition } from 'react';
import { useToast } from '@/components/toast';
import { deleteService, toggleService } from './actions';

interface Service {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion_min: number;
  categoria: string;
  es_complementario: boolean;
  activo: boolean;
}

export function ServiceTable({ services }: { services: Service[] }) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  function handleToggle(id: string, activo: boolean) {
    startTransition(async () => {
      try {
        await toggleService(id, activo);
        toast(activo ? 'Servicio activado' : 'Servicio desactivado');
      } catch {
        toast('Error al actualizar servicio', 'error');
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteService(id);
        toast('Servicio eliminado');
      } catch {
        toast('Error al eliminar servicio', 'error');
      }
    });
  }

  if (services.length === 0) {
    return (
      <div className="rounded-card bg-card shadow-card">
        <div className="px-6 py-10 text-center text-sm text-muted-foreground">
          No hay servicios registrados
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card bg-card shadow-card">
      {/* Mobile card view */}
      <div className="md:hidden divide-y divide-border">
        {services.map((svc) => (
          <div key={svc.id} className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-foreground text-sm">{svc.nombre}</span>
                {svc.es_complementario && (
                  <span className="ml-2 rounded-pill bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Complementario
                  </span>
                )}
              </div>
              <span
                className={
                  svc.activo
                    ? 'rounded-pill bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent'
                    : 'rounded-pill bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground'
                }
              >
                {svc.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            {svc.descripcion && (
              <p className="text-xs text-muted-foreground line-clamp-2">{svc.descripcion}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">${(svc.precio ?? 0).toFixed(2)}</span>
              <span>{svc.duracion_min} min</span>
              <span className="capitalize">{svc.categoria}</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleToggle(svc.id, !svc.activo)}
                className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
              >
                {svc.activo ? 'Desactivar' : 'Activar'}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDelete(svc.id)}
                className="text-xs font-semibold text-destructive hover:underline disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Nombre</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Precio</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Duracion</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Categoria</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Estado</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {services.map((svc) => (
              <tr key={svc.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-6 py-3">
                  <div className="font-medium text-foreground">{svc.nombre}</div>
                  {svc.descripcion && (
                    <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{svc.descripcion}</div>
                  )}
                  {svc.es_complementario && (
                    <span className="inline-block mt-1 rounded-pill bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Complementario
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-muted-foreground">${(svc.precio ?? 0).toFixed(2)}</td>
                <td className="px-6 py-3 text-muted-foreground">{svc.duracion_min} min</td>
                <td className="px-6 py-3 text-muted-foreground capitalize">{svc.categoria}</td>
                <td className="px-6 py-3">
                  <span
                    className={
                      svc.activo
                        ? 'rounded-pill bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent'
                        : 'rounded-pill bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground'
                    }
                  >
                    {svc.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggle(svc.id, !svc.activo)}
                      className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                    >
                      {svc.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(svc.id)}
                      className="text-xs font-semibold text-destructive hover:underline disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
