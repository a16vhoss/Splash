'use client';

import { useState, useTransition } from 'react';

interface FavoriteButtonProps {
  carWashId: string;
  initialFavorited: boolean;
  size?: 'sm' | 'md';
}

export function FavoriteButton({ carWashId, initialFavorited, size = 'md' }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    // Optimistic update
    setFavorited(!favorited);
    startTransition(async () => {
      try {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ car_wash_id: carWashId }),
        });
        const data = await res.json();
        if (res.ok) {
          setFavorited(data.favorited);
        } else {
          setFavorited(!favorited); // revert
        }
      } catch {
        setFavorited(!favorited); // revert
      }
    });
  }

  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-9 h-9 text-lg';

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`${sizeClasses} rounded-full border flex items-center justify-center transition-all ${
        favorited
          ? 'bg-destructive/10 border-destructive/30 text-destructive'
          : 'bg-white border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive'
      } ${isPending ? 'opacity-50' : ''}`}
      aria-label={favorited ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      {favorited ? '♥' : '♡'}
    </button>
  );
}
