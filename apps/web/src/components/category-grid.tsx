import Link from 'next/link';

const CATEGORIES = [
  { slug: 'exterior', label: 'Lavado exterior', icon: '🧽' },
  { slug: 'completo', label: 'Lavado completo', icon: '✨' },
  { slug: 'detailing', label: 'Detailing', icon: '💎' },
  { slug: 'encerado', label: 'Encerado', icon: '🛡️' },
];

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          href={`/autolavados?categoria=${cat.slug}`}
          className="flex flex-col items-center gap-2 rounded-modal bg-white border border-border p-5 hover:shadow-card-hover hover:border-primary/30 transition-all"
        >
          <span className="text-3xl">{cat.icon}</span>
          <span className="text-sm font-semibold text-foreground text-center">{cat.label}</span>
        </Link>
      ))}
    </div>
  );
}
