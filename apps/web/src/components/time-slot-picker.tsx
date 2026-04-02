'use client';

import { useState, useEffect } from 'react';

interface TimeSlot {
  time: string;
  available: boolean;
  estaciones_libres: number;
}

interface TimeSlotPickerProps {
  carWashId: string;
  serviceId: string;
  onSelect: (fecha: string, hora: string) => void;
}

function getNextDays(count: number): { date: string; label: string; dayName: string }[] {
  const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const result = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    result.push({
      date: d.toISOString().split('T')[0],
      label: d.getDate().toString(),
      dayName: days[d.getDay()],
    });
  }
  return result;
}

export function TimeSlotPicker({ carWashId, serviceId, onSelect }: TimeSlotPickerProps) {
  const dates = getNextDays(7);
  const [selectedDate, setSelectedDate] = useState(dates[0].date);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSelectedTime(null);
    setClosed(false);
    fetch(`/api/availability?car_wash_id=${carWashId}&service_id=${serviceId}&fecha=${selectedDate}`)
      .then(r => r.json())
      .then(data => {
        setSlots(data.slots ?? []);
        setClosed(data.closed ?? false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedDate, carWashId, serviceId]);

  return (
    <div className="space-y-6">
      {/* Date picker */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {dates.map((d) => (
          <button
            key={d.date}
            onClick={() => setSelectedDate(d.date)}
            className={`flex flex-col items-center px-4 py-2 rounded-card border transition-colors min-w-[60px] ${
              selectedDate === d.date
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-white text-foreground hover:border-primary/50'
            }`}
          >
            <span className="text-xs font-semibold">{d.dayName}</span>
            <span className="text-lg font-bold">{d.label}</span>
          </button>
        ))}
      </div>

      {/* Time slots */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : closed ? (
        <p className="text-center text-muted-foreground py-8">Cerrado este dia</p>
      ) : slots.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay horarios disponibles</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {slots.map((slot) => (
            <button
              key={slot.time}
              disabled={!slot.available}
              onClick={() => setSelectedTime(slot.time)}
              className={`py-2.5 px-3 rounded-card border text-sm font-semibold transition-colors ${
                !slot.available
                  ? 'border-border bg-muted text-muted-foreground line-through cursor-not-allowed'
                  : selectedTime === slot.time
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-white text-foreground hover:border-primary'
              }`}
            >
              {slot.time}
            </button>
          ))}
        </div>
      )}

      {/* Confirm button */}
      {selectedTime && (
        <button
          onClick={() => onSelect(selectedDate, selectedTime)}
          className="w-full py-3 rounded-card bg-primary text-white font-semibold uppercase tracking-wider text-sm hover:opacity-90 transition-opacity"
        >
          Confirmar {selectedTime}
        </button>
      )}
    </div>
  );
}
