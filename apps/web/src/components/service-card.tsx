import Link from 'next/link';

interface ServiceCardProps {
  service: {
    id: string;
    nombre: string;
    descripcion: string | null;
    precio: number;
    duracion_min: number;
  };
  carWashId: string;
}

export function ServiceCard({ service, carWashId }: ServiceCardProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-card border border-border bg-white hover:shadow-card transition-shadow duration-200">
      <div className="min-w-0 flex-1">
        <h4 className="font-semibold text-foreground">{service.nombre}</h4>
        {service.descripcion && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{service.descripcion}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{service.duracion_min} min</p>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <span className="text-lg font-bold text-foreground">${Number(service.precio).toLocaleString('es-MX')}</span>
        <Link
          href={`/agendar?car_wash_id=${carWashId}&service_id=${service.id}`}
          className="px-4 py-2 rounded-card bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Agendar
        </Link>
      </div>
    </div>
  );
}
