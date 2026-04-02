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
  };
}

export function WashCard({ wash }: WashCardProps) {
  return (
    <Link
      href={`/autolavados/${wash.slug}`}
      className="group block rounded-card bg-card border border-border p-5 hover:shadow-card-hover transition-shadow duration-200"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-card bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-primary">{wash.nombre.charAt(0)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
            {wash.nombre}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-warning text-sm">★</span>
            <span className="text-sm font-semibold text-foreground">{Number(wash.rating_promedio).toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({wash.total_reviews} resenas)</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">{wash.direccion}</p>
        </div>
      </div>
    </Link>
  );
}
