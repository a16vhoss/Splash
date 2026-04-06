import Link from 'next/link';

interface WashCardHorizontalProps {
  wash: {
    id: string;
    nombre: string;
    slug: string;
    direccion: string;
    rating_promedio: number;
    total_reviews: number;
    fotos: string[] | null;
    logo_url: string | null;
  };
  slots?: string[];
  citasHoy?: number;
}

export function WashCardHorizontal({ wash, slots, citasHoy }: WashCardHorizontalProps) {
  const fotos = wash.fotos ?? [];
  const heroPhoto = fotos[0] ?? null;

  return (
    <div className="bg-white rounded-modal border border-border overflow-hidden hover:shadow-card-hover transition-shadow flex flex-col sm:flex-row">
      <Link href={`/autolavados/${wash.slug}`} className="sm:w-44 h-36 sm:h-auto flex-shrink-0 block">
        {heroPhoto ? (
          <img src={heroPhoto} alt={wash.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
            <span className="text-4xl font-extrabold text-white/80">{wash.nombre.charAt(0)}</span>
          </div>
        )}
      </Link>

      <div className="flex-1 p-4">
        <div className="flex items-start justify-between">
          <Link href={`/autolavados/${wash.slug}`} className="hover:text-primary transition-colors">
            <h3 className="font-bold text-base text-foreground">{wash.nombre}</h3>
          </Link>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          <span className="text-warning">★</span>{' '}
          <span className="font-semibold text-foreground">{Number(wash.rating_promedio).toFixed(1)}</span>
          {' · '}{wash.total_reviews} reseñas
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">{wash.direccion}</p>

        {citasHoy != null && citasHoy > 0 && (
          <p className="text-xs text-accent font-semibold mt-1.5">{citasHoy} citas hoy</p>
        )}

        {slots && slots.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {slots.slice(0, 5).map((slot) => (
              <Link
                key={slot}
                href={`/agendar?car_wash_id=${wash.id}&fecha=${new Date().toISOString().split('T')[0]}&hora=${slot}`}
                className="px-3 py-1 rounded-pill bg-primary text-white text-xs font-semibold hover:bg-primary-light transition-colors"
              >
                {slot}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
