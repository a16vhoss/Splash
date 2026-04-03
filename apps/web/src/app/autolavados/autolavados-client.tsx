'use client';

import { useState } from 'react';
import { CarWashMap } from '@/components/car-wash-map';

interface CarWash {
  id: string;
  nombre: string;
  slug: string;
  latitud: number | null;
  longitud: number | null;
  rating_promedio: number;
  direccion: string | null;
}

export function AutolavadosMap({ carWashes }: { carWashes: CarWash[] }) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  function requestLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const mappable = carWashes.filter((cw) => cw.latitud != null && cw.longitud != null) as Array<CarWash & { latitud: number; longitud: number }>;

  function handleMarkerClick(slug: string) {
    const el = document.getElementById(`wash-${slug}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (mappable.length === 0) return null;

  return (
    <div className="mb-6">
      <CarWashMap
        carWashes={mappable}
        userLocation={userLocation}
        onMarkerClick={handleMarkerClick}
      />
      <div className="mt-3 flex justify-center">
        <button
          onClick={requestLocation}
          disabled={locating}
          className="flex items-center gap-2 rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
          {locating ? 'Buscando...' : userLocation ? 'Actualizar ubicacion' : 'Usar mi ubicacion'}
        </button>
      </div>
    </div>
  );
}
