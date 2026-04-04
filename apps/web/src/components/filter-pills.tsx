'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const RATING_OPTIONS = [
  { value: '4', label: '★ 4+' },
  { value: '4.5', label: '★ 4.5+' },
];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Mejor calificación' },
  { value: 'reviews', label: 'Más reseñas' },
  { value: 'name', label: 'Nombre A-Z' },
];

export function FilterPills() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function toggleParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/autolavados?${params.toString()}`);
  }

  const activeRating = searchParams.get('rating');
  const activeSort = searchParams.get('sort');
  const activeCategoria = searchParams.get('categoria');

  return (
    <div className="flex flex-wrap gap-2">
      {RATING_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => toggleParam('rating', opt.value)}
          className={`px-3 py-1.5 rounded-pill text-xs font-semibold border transition-colors ${
            activeRating === opt.value
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-foreground border-border hover:border-primary/50'
          }`}
        >
          {opt.label}
        </button>
      ))}

      {activeCategoria && (
        <button
          onClick={() => toggleParam('categoria', activeCategoria)}
          className="px-3 py-1.5 rounded-pill text-xs font-semibold bg-primary text-white border border-primary"
        >
          {activeCategoria} ✕
        </button>
      )}

      <select
        value={activeSort || 'rating'}
        onChange={(e) => toggleParam('sort', e.target.value)}
        className="px-3 py-1.5 rounded-pill text-xs font-semibold border border-border bg-white text-foreground"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
