'use client';

import { useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

interface CarWashMarker {
  id: string;
  nombre: string;
  slug: string;
  latitud: number;
  longitud: number;
  rating_promedio: number;
}

interface CarWashMapProps {
  carWashes: CarWashMarker[];
  userLocation: { lat: number; lng: number } | null;
  onMarkerClick?: (slug: string) => void;
}

const containerStyle = { width: '100%', height: '300px' };
const defaultCenter = { lat: 20.6597, lng: -103.3496 };

export function CarWashMap({ carWashes, userLocation, onMarkerClick }: CarWashMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '',
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    if (carWashes.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      carWashes.forEach((cw) => bounds.extend({ lat: cw.latitud, lng: cw.longitud }));
      if (userLocation) bounds.extend(userLocation);
      map.fitBounds(bounds);
    }
  }, [carWashes, userLocation]);

  if (!isLoaded) {
    return <div className="w-full h-[300px] rounded-card bg-muted animate-pulse" />;
  }

  const center = userLocation ?? (carWashes.length > 0
    ? { lat: carWashes[0].latitud, lng: carWashes[0].longitud }
    : defaultCenter);

  return (
    <div className="rounded-card overflow-hidden shadow-card">
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12} onLoad={onLoad}>
        {userLocation && (
          <MarkerF
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#0284C7',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            }}
            title="Tu ubicacion"
          />
        )}
        {carWashes.map((cw) => (
          <MarkerF
            key={cw.id}
            position={{ lat: cw.latitud, lng: cw.longitud }}
            title={cw.nombre}
            onClick={() => onMarkerClick?.(cw.slug)}
          />
        ))}
      </GoogleMap>
    </div>
  );
}
