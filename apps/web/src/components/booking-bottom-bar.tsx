'use client';

import { useState } from 'react';

interface BookingBottomBarProps {
  minPrice: number;
  carWashId: string;
}

export function BookingBottomBar({ minPrice, carWashId }: BookingBottomBarProps) {
  const [showWidget, setShowWidget] = useState(false);

  return (
    <>
      {/* Sticky bottom bar - visible on mobile only */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-3 flex items-center justify-between shadow-modal lg:hidden z-40">
        <div>
          <div className="text-[10px] text-muted-foreground">Desde</div>
          <div className="text-lg font-extrabold text-accent">${Number(minPrice).toLocaleString('es-MX')} MXN</div>
        </div>
        <a
          href={`/agendar?car_wash_id=${carWashId}`}
          className="px-6 py-2.5 rounded-card bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-colors"
        >
          Reservar ahora
        </a>
      </div>
      {/* Spacer to prevent content from being hidden behind the bar */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
