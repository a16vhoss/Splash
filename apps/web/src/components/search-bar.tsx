'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const VEHICLE_TYPES = [
  { value: 'sedan', label: 'Sedán' },
  { value: 'suv', label: 'SUV' },
  { value: 'camioneta', label: 'Camioneta' },
  { value: 'moto', label: 'Moto' },
];

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getDefaultTime() {
  const now = new Date();
  const hour = now.getHours();
  const rounded = hour < 23 ? hour + 1 : hour;
  return `${String(rounded).padStart(2, '0')}:00`;
}

function generateTimeSlots() {
  const slots: string[] = [];
  for (let h = 7; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

interface SearchBarProps {
  defaultQuery?: string;
  defaultFecha?: string;
  defaultHora?: string;
  defaultVehiculo?: string;
  variant?: 'hero' | 'compact';
}

export function SearchBar({
  defaultQuery = '',
  defaultFecha,
  defaultHora,
  defaultVehiculo,
  variant = 'hero',
}: SearchBarProps) {
  const router = useRouter();
  const [fecha, setFecha] = useState(defaultFecha || getTodayStr());
  const [hora, setHora] = useState(defaultHora || getDefaultTime());
  const [vehiculo, setVehiculo] = useState(defaultVehiculo || 'sedan');
  const [zona, setZona] = useState(defaultQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (zona) params.set('q', zona);
    if (fecha) params.set('fecha', fecha);
    if (hora) params.set('hora', hora);
    if (vehiculo) params.set('vehiculo', vehiculo);
    router.push(`/autolavados?${params.toString()}`);
  }

  const isCompact = variant === 'compact';

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-modal shadow-modal flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-0 ${
        isCompact ? 'p-2' : 'p-3 md:p-2'
      } max-w-3xl w-full mx-auto`}
    >
      {/* Fecha */}
      <div className="flex-1 px-3 py-2 md:border-r border-border">
        <label className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          min={getTodayStr()}
          className="w-full text-sm text-foreground bg-transparent border-none outline-none p-0 mt-0.5"
        />
      </div>

      {/* Hora */}
      <div className="flex-1 px-3 py-2 md:border-r border-border">
        <label className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">Hora</label>
        <select
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          className="w-full text-sm text-foreground bg-transparent border-none outline-none p-0 mt-0.5"
        >
          {TIME_SLOTS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Vehículo */}
      <div className="flex-1 px-3 py-2 md:border-r border-border">
        <label className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">Vehículo</label>
        <select
          value={vehiculo}
          onChange={(e) => setVehiculo(e.target.value)}
          className="w-full text-sm text-foreground bg-transparent border-none outline-none p-0 mt-0.5"
        >
          {VEHICLE_TYPES.map((v) => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Zona */}
      <div className="flex-[2] px-3 py-2">
        <label className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">Zona</label>
        <input
          type="text"
          value={zona}
          onChange={(e) => setZona(e.target.value)}
          placeholder="Buscar por nombre o zona..."
          className="w-full text-sm text-foreground bg-transparent border-none outline-none p-0 mt-0.5 placeholder:text-muted-foreground"
        />
      </div>

      {/* Submit */}
      <div className="px-2 py-1">
        <button
          type="submit"
          className="w-full md:w-auto px-6 py-2.5 rounded-card bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors whitespace-nowrap"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
