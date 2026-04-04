'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPickerProps {
  defaultLat: number | null;
  defaultLng: number | null;
  height?: string;
}

const DEFAULT_CENTER: [number, number] = [20.6597, -103.3496];

export function LocationPicker({ defaultLat, defaultLng, height = '300px' }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [lat, setLat] = useState<number | null>(defaultLat);
  const [lng, setLng] = useState<number | null>(defaultLng);
  const [locating, setLocating] = useState(false);

  const pinIcon = L.divIcon({
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
  });

  function placeMarker(map: L.Map, position: [number, number]) {
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    } else {
      markerRef.current = L.marker(position, { icon: pinIcon }).addTo(map);
    }
    setLat(position[0]);
    setLng(position[1]);
  }

  const buildMap = useCallback(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    const center: [number, number] =
      defaultLat && defaultLng ? [defaultLat, defaultLng] : DEFAULT_CENTER;

    const map = L.map(mapRef.current).setView(center, defaultLat ? 15 : 12);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
      pane: 'overlayPane',
    }).addTo(map);

    // Place initial marker if we have coordinates
    if (defaultLat && defaultLng) {
      placeMarker(map, [defaultLat, defaultLng]);
    }

    // Click to place pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      placeMarker(map, [e.latlng.lat, e.latlng.lng]);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    buildMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [buildMap]);

  function handleUseMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = mapInstanceRef.current;
        if (map) {
          map.setView([latitude, longitude], 16);
          placeMarker(map, [latitude, longitude]);
        }
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="flex items-center gap-2 rounded-input border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
          {locating ? 'Obteniendo ubicacion...' : 'Usar mi ubicacion'}
        </button>
        <span className="text-xs text-muted-foreground">o haz click en el mapa</span>
      </div>

      <div className="rounded-card overflow-hidden border border-border relative z-0">
        <div ref={mapRef} style={{ width: '100%', height }} />
      </div>

      {lat !== null && lng !== null && (
        <p className="text-xs text-muted-foreground">
          Coordenadas: {lat.toFixed(7)}, {lng.toFixed(7)}
        </p>
      )}

      <input type="hidden" name="latitud" value={lat ?? ''} />
      <input type="hidden" name="longitud" value={lng ?? ''} />
    </div>
  );
}
