'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export function ListingMapSection({ carWashes }: { carWashes: CarWash[] }) {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const mappable = carWashes.filter((cw) => cw.latitud != null && cw.longitud != null) as Array<CarWash & { latitud: number; longitud: number }>;

  if (mappable.length === 0) return <div className="rounded-modal bg-muted h-80 flex items-center justify-center text-muted-foreground text-sm">Sin ubicaciones disponibles</div>;

  return (
    <div className="rounded-modal overflow-hidden h-[calc(100vh-180px)]">
      <CarWashMap
        carWashes={mappable}
        userLocation={userLocation}
        onMarkerClick={(slug) => router.push(`/autolavados/${slug}`)}
      />
    </div>
  );
}
