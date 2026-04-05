'use client';

import { useState, useEffect, useMemo } from 'react';
import { WashCardHorizontal } from '@/components/wash-card-horizontal';
import { ListingMapSection } from './listing-client';

interface CarWash {
  id: string;
  nombre: string;
  slug: string;
  direccion: string;
  rating_promedio: number;
  total_reviews: number;
  logo_url: string | null;
  fotos: any;
  latitud: number | null;
  longitud: number | null;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Props {
  washes: CarWash[];
  query?: string;
}

export function AutolavadosListing({ washes, query }: Props) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const sortedWashes = useMemo(() => {
    const list = [...washes];
    if (userLocation) {
      list.sort((a, b) => {
        const distA = a.latitud && a.longitud ? getDistance(userLocation.lat, userLocation.lng, a.latitud, a.longitud) : 9999;
        const distB = b.latitud && b.longitud ? getDistance(userLocation.lat, userLocation.lng, b.latitud, b.longitud) : 9999;
        return distA - distB;
      });
    }
    return list;
  }, [washes, userLocation]);

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        {sortedWashes.length} autolavados encontrados
        {query ? ` para "${query}"` : ''}
        {userLocation ? ' · Más cercanos primero' : ''}
      </p>

      {sortedWashes.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="flex-1 min-w-0 space-y-3">
            {sortedWashes.map((wash) => (
              <WashCardHorizontal key={wash.id} wash={wash} />
            ))}
          </div>
          <div className="hidden lg:block w-[400px] flex-shrink-0">
            <div className="sticky top-6">
              <ListingMapSection carWashes={sortedWashes} />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">No se encontraron autolavados.</p>
        </div>
      )}
    </>
  );
}
