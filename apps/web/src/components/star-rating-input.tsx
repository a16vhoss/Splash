'use client';

import { useState } from 'react';

const labels = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
}

export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-3xl transition-colors focus:outline-none"
          >
            <span className={(hover || value) >= star ? 'text-warning' : 'text-border'}>
              ★
            </span>
          </button>
        ))}
      </div>
      {(hover || value) > 0 && (
        <span className="text-sm font-semibold text-foreground">{labels[hover || value]}</span>
      )}
    </div>
  );
}
