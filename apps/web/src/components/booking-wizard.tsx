'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ── Types ────────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  nombre: string;
  precio: number;
  duracion_min: number;
  es_complementario: boolean;
}

interface Slot {
  time: string;
  capacidad: number;
  ocupados: number;
  disponibles: number;
  clienteOcupado?: boolean;
}

interface AvailabilityResponse {
  slots: Slot[];
  closed: boolean;
  slot_duration_min: number;
}

interface BookingWizardProps {
  carWashId: string;
  initialServiceId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function getNext14Days(): { date: string; dayName: string; dayNum: number; month: string }[] {
  const result = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    result.push({
      date: `${yyyy}-${mm}-${dd}`,
      dayName: DAYS[d.getDay()],
      dayNum: d.getDate(),
      month: MONTHS[d.getMonth()],
    });
  }
  return result;
}

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: 'Efectivo (pago en sitio)',
  tarjeta_sitio: 'Tarjeta (pago en sitio)',
  transferencia: 'Transferencia bancaria',
};

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step, onGoTo }: { step: number; onGoTo: (s: number) => void }) {
  const steps = ['Servicio', 'Fecha', 'Hora', 'Confirmar'];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const isCompleted = i < step;
        const isCurrent = i === step;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => isCompleted && onGoTo(i)}
              disabled={!isCompleted}
              className={`flex flex-col items-center gap-1 group ${isCompleted ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isCompleted
                    ? 'bg-accent text-white'
                    : isCurrent
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  isCurrent ? 'text-primary' : isCompleted ? 'text-accent' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 transition-colors ${i < step ? 'bg-accent' : 'bg-border'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 0: Service ───────────────────────────────────────────────────────────

function StepService({
  services,
  extras,
  selectedServiceId,
  selectedExtras,
  onSelectService,
  onToggleExtra,
  onNext,
}: {
  services: Service[];
  extras: Service[];
  selectedServiceId: string | null;
  selectedExtras: string[];
  onSelectService: (id: string) => void;
  onToggleExtra: (id: string) => void;
  onNext: () => void;
}) {
  const selectedService = services.find((s) => s.id === selectedServiceId);
  const extrasTotal = extras
    .filter((e) => selectedExtras.includes(e.id))
    .reduce((sum, e) => sum + Number(e.precio), 0);
  const total = selectedService ? Number(selectedService.precio) + extrasTotal : 0;

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4">Elige un servicio</h2>
      <div className="space-y-3 mb-6">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelectService(s.id)}
            className={`w-full text-left rounded-card border p-4 transition-colors ${
              selectedServiceId === s.id
                ? 'border-primary bg-primary/5'
                : 'border-border bg-white hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{s.nombre}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.duracion_min} min</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-foreground">
                  ${Number(s.precio).toLocaleString('es-MX')}
                </span>
                {selectedServiceId === s.id && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {extras.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold text-foreground mb-3">Extras opcionales</h3>
          <div className="space-y-2">
            {extras.map((e) => (
              <label
                key={e.id}
                className="flex items-center gap-3 rounded-card border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedExtras.includes(e.id)}
                  onChange={() => onToggleExtra(e.id)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{e.nombre}</span>
                  <span className="text-xs text-muted-foreground ml-2">{e.duracion_min} min</span>
                </div>
                <span className="text-sm font-bold text-foreground">
                  +${Number(e.precio).toLocaleString('es-MX')}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {selectedService && (
        <>
          <div className="flex items-center justify-between py-3 border-t border-border">
            <span className="text-sm font-medium text-muted-foreground">Total estimado</span>
            <span className="text-lg font-bold text-foreground">${total.toLocaleString('es-MX')}</span>
          </div>
          <button
            type="button"
            onClick={onNext}
            className="w-full mt-3 rounded-card bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
          >
            Continuar
          </button>
        </>
      )}
    </div>
  );
}

// ── Step 1: Date ──────────────────────────────────────────────────────────────

function StepDate({ onSelectDate }: { onSelectDate: (date: string) => void }) {
  const days = getNext14Days();
  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4">Selecciona una fecha</h2>
      <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-7 gap-2">
        {days.map((d) => (
          <button
            key={d.date}
            onClick={() => onSelectDate(d.date)}
            className="flex flex-col items-center py-3 px-2 rounded-card border border-border bg-white hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <span className="text-xs font-semibold text-muted-foreground">{d.dayName}</span>
            <span className="text-xl font-bold text-foreground">{d.dayNum}</span>
            <span className="text-xs text-muted-foreground">{d.month}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 2: Time ──────────────────────────────────────────────────────────────

function StepTime({
  carWashId,
  fecha,
  onSelectTime,
}: {
  carWashId: string;
  fecha: string;
  onSelectTime: (time: string) => void;
}) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    setLoading(true);
    setClosed(false);
    fetch(`/api/availability?car_wash_id=${carWashId}&fecha=${fecha}`)
      .then((r) => r.json())
      .then((data: AvailabilityResponse) => {
        setSlots(data.slots ?? []);
        setClosed(data.closed ?? false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [carWashId, fecha]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (closed) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Cerrado este día</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">No hay horarios disponibles</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4">Selecciona un horario</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {slots.map((slot) => {
          const isFull = slot.disponibles === 0;
          const isClientBusy = slot.clienteOcupado === true;
          const isBlocked = isFull || isClientBusy;
          const isLow = !isBlocked && slot.disponibles >= 1 && slot.disponibles <= 2;

          return (
            <button
              key={slot.time}
              disabled={isBlocked}
              onClick={() => !isBlocked && onSelectTime(slot.time)}
              className={`rounded-card border p-4 text-left transition-colors ${
                isBlocked
                  ? 'border-border bg-muted cursor-not-allowed'
                  : 'border-border bg-white hover:border-primary cursor-pointer'
              }`}
            >
              <p className={`text-base font-bold ${isBlocked ? 'text-muted-foreground' : 'text-foreground'}`}>{slot.time}</p>
              <p
                className={`text-xs font-semibold mt-1 ${
                  isBlocked
                    ? 'text-muted-foreground'
                    : isLow
                    ? 'text-yellow-600'
                    : 'text-accent'
                }`}
              >
                {isClientBusy
                  ? 'Ya tienes cita'
                  : isFull
                  ? 'Lleno'
                  : isLow
                  ? `${slot.disponibles} lugar${slot.disponibles > 1 ? 'es' : ''}`
                  : `${slot.disponibles} lugares`}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 3: Confirm ───────────────────────────────────────────────────────────

function StepConfirm({
  service,
  extras,
  fecha,
  hora,
  availableMethods,
  paymentMethod,
  onChangePayment,
  recordatorioDias,
  onChangeRecordatorio,
  onConfirm,
  loading,
  error,
}: {
  service: Service;
  extras: Service[];
  fecha: string;
  hora: string;
  availableMethods: string[];
  paymentMethod: string;
  onChangePayment: (m: string) => void;
  recordatorioDias: number;
  onChangeRecordatorio: (d: number) => void;
  onConfirm: () => void;
  loading: boolean;
  error: string | null;
}) {
  const extrasTotal = extras.reduce((sum, e) => sum + Number(e.precio), 0);
  const total = Number(service.precio) + extrasTotal;

  // Format fecha nicely
  const [year, month, day] = fecha.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const fechaLabel = `${DAYS[d.getDay()]} ${day} de ${MONTHS[month - 1]} ${year}`;

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4">Confirmar cita</h2>

      {/* Summary */}
      <div className="rounded-card border border-border bg-white p-4 mb-6 space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Servicio</span>
          <span className="text-sm font-semibold text-foreground">{service.nombre}</span>
        </div>
        {extras.map((e) => (
          <div key={e.id} className="flex justify-between">
            <span className="text-sm text-muted-foreground">+ {e.nombre}</span>
            <span className="text-sm font-semibold text-foreground">
              +${Number(e.precio).toLocaleString('es-MX')}
            </span>
          </div>
        ))}
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Fecha</span>
          <span className="text-sm font-semibold text-foreground">{fechaLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Hora</span>
          <span className="text-sm font-semibold text-foreground">{hora}</span>
        </div>
        <div className="border-t border-border pt-3 flex justify-between">
          <span className="text-sm font-bold text-foreground">Total</span>
          <span className="text-lg font-bold text-foreground">${total.toLocaleString('es-MX')}</span>
        </div>
      </div>

      {/* Payment method */}
      {availableMethods.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-semibold text-foreground mb-3">Método de pago</h3>
          <div className="space-y-2">
            {availableMethods.map((method) => (
              <label
                key={method}
                className="flex items-center gap-3 rounded-card border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <input
                  type="radio"
                  name="metodo_pago"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={() => onChangePayment(method)}
                  className="h-4 w-4 border-border text-primary focus:ring-ring"
                />
                <span className="text-sm font-medium text-foreground">
                  {PAYMENT_LABELS[method] ?? method}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Reminder */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-foreground mb-3">Recordatorio</h3>
        <div className="space-y-2">
          {[
            { value: 0, label: 'No recordar' },
            { value: 1, label: '1 día antes' },
            { value: 2, label: '2 días antes' },
            { value: 3, label: '3 días antes' },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 rounded-card border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <input
                type="radio"
                name="recordatorio"
                value={opt.value}
                checked={recordatorioDias === opt.value}
                onChange={() => onChangeRecordatorio(opt.value)}
                className="h-4 w-4 border-border text-primary focus:ring-ring"
              />
              <span className="text-sm font-medium text-foreground">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-card bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <button
        onClick={onConfirm}
        disabled={loading || (availableMethods.length > 0 && !paymentMethod)}
        className="w-full py-3 rounded-card bg-primary text-white font-semibold uppercase tracking-wider text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {loading ? 'Agendando…' : 'Confirmar cita'}
      </button>
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export function BookingWizard({ carWashId, initialServiceId }: BookingWizardProps) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<number>(0);

  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [extras, setExtras] = useState<Service[]>([]);
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Selections
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(initialServiceId ?? null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [recordatorioDias, setRecordatorioDias] = useState<number>(1);

  // Confirm state
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Load services and car wash info
  useEffect(() => {
    const load = async () => {
      const [servicesRes, cwRes] = await Promise.all([
        supabase
          .from('services')
          .select('id, nombre, precio, duracion_min, es_complementario')
          .eq('car_wash_id', carWashId)
          .eq('activo', true)
          .order('precio', { ascending: true }),
        supabase
          .from('car_washes')
          .select('metodos_pago')
          .eq('id', carWashId)
          .single(),
      ]);

      const allServices: Service[] = servicesRes.data ?? [];
      setServices(allServices.filter((s) => !s.es_complementario));
      setExtras(allServices.filter((s) => s.es_complementario));

      const methods: string[] = (cwRes.data?.metodos_pago ?? ['efectivo']).filter(
        (m: string) => m !== 'pago_en_linea'
      );
      setAvailableMethods(methods);
      if (methods.length === 1) setPaymentMethod(methods[0]);

      setLoadingData(false);
    };
    load();
  }, [carWashId]);

  // Handlers
  function handleSelectService(id: string) {
    setSelectedServiceId(id);
  }

  function handleNextFromService() {
    if (selectedServiceId) setStep(1);
  }

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setStep(2);
  }

  function handleSelectTime(time: string) {
    setSelectedTime(time);
    setStep(3);
  }

  function handleToggleExtra(id: string) {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleGoTo(s: number) {
    setStep(s);
  }

  async function handleConfirm() {
    if (!selectedServiceId || !selectedDate || !selectedTime) return;

    setBooking(true);
    setBookingError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push(
        `/login?redirect=/agendar?car_wash_id=${carWashId}`
      );
      return;
    }

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        car_wash_id: carWashId,
        service_id: selectedServiceId,
        fecha: selectedDate,
        hora_inicio: selectedTime,
        servicios_complementarios: selectedExtras.length > 0 ? selectedExtras : undefined,
        metodo_pago: paymentMethod || undefined,
        recordatorio_dias: recordatorioDias,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setBookingError(data.error ?? 'Error al agendar');
      setBooking(false);
      return;
    }

    router.push('/mis-citas?success=1');
  }

  if (loadingData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedService = services.find((s) => s.id === selectedServiceId) ?? null;
  const selectedExtraObjects = extras.filter((e) => selectedExtras.includes(e.id));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Agendar cita</h1>

      <ProgressBar step={step} onGoTo={handleGoTo} />

      {/* Back button */}
      {step > 0 && (
        <button
          onClick={() => setStep((s) => s - 1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Atrás
        </button>
      )}

      {/* Step content */}
      {step === 0 && (
        <StepService
          services={services}
          extras={extras}
          selectedServiceId={selectedServiceId}
          selectedExtras={selectedExtras}
          onSelectService={handleSelectService}
          onToggleExtra={handleToggleExtra}
          onNext={handleNextFromService}
        />
      )}

      {step === 1 && (
        <StepDate onSelectDate={handleSelectDate} />
      )}

      {step === 2 && selectedDate && (
        <StepTime
          carWashId={carWashId}
          fecha={selectedDate}
          onSelectTime={handleSelectTime}
        />
      )}

      {step === 3 && selectedService && selectedDate && selectedTime && (
        <StepConfirm
          service={selectedService}
          extras={selectedExtraObjects}
          fecha={selectedDate}
          hora={selectedTime}
          availableMethods={availableMethods}
          paymentMethod={paymentMethod}
          onChangePayment={setPaymentMethod}
          recordatorioDias={recordatorioDias}
          onChangeRecordatorio={setRecordatorioDias}
          onConfirm={handleConfirm}
          loading={booking}
          error={bookingError}
        />
      )}
    </div>
  );
}
