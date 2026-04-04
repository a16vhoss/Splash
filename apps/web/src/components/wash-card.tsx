import Link from 'next/link';

interface WashCardProps {
  wash: {
    id: string;
    nombre: string;
    slug: string;
    direccion: string;
    rating_promedio: number;
    total_reviews: number;
    logo_url: string | null;
    fotos?: string[] | null;
  };
}

export function WashCard({ wash }: WashCardProps) {
  const fotos = wash.fotos ?? [];
  const heroPhoto = fotos[0] ?? null;

  return (
    <Link
      href={`/autolavados/${wash.slug}`}
      className="group block rounded-modal bg-white border border-border overflow-hidden hover:shadow-card-hover transition-shadow duration-200"
    >
      <div className="h-32 relative">
        {heroPhoto ? (
          <img src={heroPhoto} alt={wash.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light" />
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
          {wash.nombre}
        </h3>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-warning text-sm">★</span>
          <span className="text-sm font-semibold text-foreground">{Number(wash.rating_promedio).toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({wash.total_reviews} reseñas)</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">{wash.direccion}</p>
      </div>
    </Link>
  );
}
