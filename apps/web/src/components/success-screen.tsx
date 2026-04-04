import Link from 'next/link';

interface SuccessScreenProps {
  carWashName: string;
  carWashSlug: string;
  serviceName: string;
  fecha: string;
  hora: string;
  total: number;
  carWashLatitud?: number | null;
  carWashLongitud?: number | null;
  carWashWhatsapp?: string | null;
  appointmentId: string;
}

export function SuccessScreen({
  carWashName,
  carWashSlug: _carWashSlug,
  serviceName,
  fecha,
  hora,
  total,
  carWashLatitud,
  carWashLongitud,
  carWashWhatsapp,
  appointmentId,
}: SuccessScreenProps) {
  const fechaFormatted = new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  // Generate ICS content for calendar
  const icsDate = fecha.replace(/-/g, '');
  const icsStart = `${icsDate}T${hora.replace(':', '')}00`;
  const calendarUrl = `data:text/calendar;charset=utf-8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:${icsStart}%0ASUMMARY:${encodeURIComponent(serviceName + ' - ' + carWashName)}%0AEND:VEVENT%0AEND:VCALENDAR`;

  return (
    <div className="max-w-md mx-auto py-12 px-4 text-center">
      {/* Success icon */}
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
        <span className="text-4xl text-accent">✓</span>
      </div>
      <h1 className="text-2xl font-extrabold text-foreground mb-1">¡Cita confirmada!</h1>
      <p className="text-sm text-muted-foreground mb-6">Te enviamos un email de confirmacion</p>

      {/* Summary card */}
      <div className="bg-white rounded-modal border border-border p-4 text-left mb-5 shadow-card">
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-muted">
          <div className="w-12 h-12 rounded-card bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
            <span className="text-white font-bold text-lg">{carWashName.charAt(0)}</span>
          </div>
          <div>
            <div className="font-bold text-foreground">{carWashName}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Servicio:</span> <span className="font-semibold text-foreground">{serviceName}</span></div>
          <div><span className="text-muted-foreground">Fecha:</span> <span className="font-semibold text-foreground">{fechaFormatted}</span></div>
          <div><span className="text-muted-foreground">Hora:</span> <span className="font-semibold text-foreground">{hora}</span></div>
          <div><span className="text-muted-foreground">Total:</span> <span className="font-bold text-accent">${Number(total).toLocaleString('es-MX')} MXN</span></div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-4">
        <a
          href={calendarUrl}
          download={`cita-${appointmentId}.ics`}
          className="flex-1 bg-white border border-border rounded-card p-3 text-center hover:shadow-card transition-shadow"
        >
          <div className="text-xl mb-1">📅</div>
          <div className="text-xs font-semibold text-foreground">Calendario</div>
        </a>
        {carWashLatitud && carWashLongitud && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${carWashLatitud},${carWashLongitud}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white border border-border rounded-card p-3 text-center hover:shadow-card transition-shadow"
          >
            <div className="text-xl mb-1">🗺️</div>
            <div className="text-xs font-semibold text-foreground">Como llegar</div>
          </a>
        )}
        {carWashWhatsapp && (
          <a
            href={`https://wa.me/${carWashWhatsapp}?text=${encodeURIComponent(`Hola, acabo de agendar una cita para ${fechaFormatted} a las ${hora}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white border border-border rounded-card p-3 text-center hover:shadow-card transition-shadow"
          >
            <div className="text-xl mb-1">💬</div>
            <div className="text-xs font-semibold text-foreground">WhatsApp</div>
          </a>
        )}
      </div>

      <Link
        href="/mis-citas"
        className="block w-full py-3 rounded-card bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors"
      >
        Ver mis citas
      </Link>
    </div>
  );
}
