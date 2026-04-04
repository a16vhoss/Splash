'use client';

import { useSearchParams } from 'next/navigation';
import { BookingWizard } from '@/components/booking-wizard';

export default function AgendarPage() {
  const searchParams = useSearchParams();
  const carWashId = searchParams.get('car_wash_id');
  const serviceId = searchParams.get('service_id');

  if (!carWashId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Selecciona un autolavado para agendar.</p>
      </div>
    );
  }

  return <BookingWizard carWashId={carWashId} initialServiceId={serviceId ?? undefined} />;
}
