'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NewBusinessModal } from './new-business-modal';

interface CarWash {
  id: string;
  nombre: string;
  subscription_status: string | null;
}

interface BusinessSwitcherProps {
  carWashes: CarWash[];
  selectedId: string | null;
}

export function BusinessSwitcher({ carWashes, selectedId }: BusinessSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const selected = carWashes.find((cw) => cw.id === selectedId) ?? carWashes[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function switchBusiness(id: string) {
    document.cookie = `selected_car_wash_id=${id};path=/;max-age=${60 * 60 * 24 * 365}`;
    setOpen(false);
    router.refresh();
  }

  function handleCreated(id: string) {
    document.cookie = `selected_car_wash_id=${id};path=/;max-age=${60 * 60 * 24 * 365}`;
    setShowModal(false);
    setOpen(false);
    router.refresh();
  }

  if (!selected) return null;

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-left group"
        >
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            {selected.nombre}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'text-muted-foreground transition-transform',
              open && 'rotate-180'
            )}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-2 w-72 rounded-card bg-card border border-border shadow-modal z-50">
            <div className="p-2">
              <p className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Tus negocios
              </p>
              {carWashes.map((cw) => (
                <button
                  key={cw.id}
                  onClick={() => switchBusiness(cw.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-[6px] px-3 py-2 text-sm transition-colors',
                    cw.id === selected.id
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {cw.nombre.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="truncate w-full">{cw.nombre}</span>
                    {cw.subscription_status && (
                      <span className="text-[11px] text-muted-foreground">{cw.subscription_status}</span>
                    )}
                  </div>
                  {cw.id === selected.id && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0 text-primary">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-border p-2">
              <button
                onClick={() => {
                  setOpen(false);
                  setShowModal(true);
                }}
                className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-sm font-semibold text-primary hover:bg-muted transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Abrir otro negocio
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <NewBusinessModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
