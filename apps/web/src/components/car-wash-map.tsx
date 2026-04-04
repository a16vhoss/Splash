'use client';

import { useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CarWashMarker {
  id: string;
  nombre: string;
  slug: string;
  latitud: number;
  longitud: number;
  rating_promedio: number;
  direccion?: string | null;
}

interface CarWashMapProps {
  carWashes: CarWashMarker[];
  userLocation: { lat: number; lng: number } | null;
  onMarkerClick?: (slug: string) => void;
}

const defaultCenter: [number, number] = [20.6597, -103.3496];

export function CarWashMap({ carWashes, userLocation, onMarkerClick }: CarWashMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const buildMap = useCallback(() => {
    if (!mapRef.current) return;

    // Destroy previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const center: [number, number] = userLocation
      ? [userLocation.lat, userLocation.lng]
      : carWashes.length > 0
        ? [carWashes[0].latitud, carWashes[0].longitud]
        : defaultCenter;

    const map = L.map(mapRef.current).setView(center, 12);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    // Labels layer on top
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
      pane: 'overlayPane',
    }).addTo(map);

    // Car wash markers
    const bounds = L.latLngBounds([]);

    const carWashIcon = L.divIcon({
      className: '',
      html: `<div style="
        width: 36px; height: 36px;
        background: #0284C7;
        border: 3px solid #fff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });

    carWashes.forEach((cw) => {
      const marker = L.marker([cw.latitud, cw.longitud], { icon: carWashIcon }).addTo(map);

      const rating = cw.rating_promedio > 0 ? cw.rating_promedio.toFixed(1) : '—';
      const addr = cw.direccion ? `<div style="color:#64748b;font-size:11px;margin-top:2px;">${cw.direccion}</div>` : '';
      marker.bindTooltip(
        `<div style="font-size:13px;font-weight:600;">${cw.nombre}</div>
         <div style="font-size:11px;color:#f59e0b;margin-top:2px;">★ ${rating}</div>
         ${addr}`,
        { direction: 'top', offset: [0, -36], opacity: 1 }
      );

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(cw.slug));
      }
      bounds.extend([cw.latitud, cw.longitud]);
    });

    // User location marker
    if (userLocation) {
      L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 8,
        fillColor: '#0284C7',
        fillOpacity: 1,
        color: '#fff',
        weight: 2,
      })
        .bindPopup('Tu ubicación')
        .addTo(map);
    }

    // If user location is available, center on it at close zoom
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 14);
    } else if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [carWashes, userLocation, onMarkerClick]);

  useEffect(() => {
    buildMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [buildMap]);

  return (
    <div className="rounded-card overflow-hidden shadow-card relative z-0">
      <div ref={mapRef} style={{ width: '100%', height: '300px' }} />
    </div>
  );
}
