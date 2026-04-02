interface RatingSummaryProps {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      className={filled ? 'text-warning' : 'text-border'}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function RatingSummary({ average, total, distribution }: RatingSummaryProps) {
  return (
    <div className="rounded-card bg-card p-6 shadow-card">
      <p className="mb-4 text-sm font-semibold text-muted-foreground">Calificaciones</p>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-5xl font-bold text-foreground">{average.toFixed(1)}</p>
          <div className="mt-1 flex justify-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} filled={star <= Math.round(average)} />
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{total} resenas</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-3 text-right text-xs text-muted-foreground">{star}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-pill bg-muted">
                  <div
                    className="h-full rounded-pill bg-warning"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-5 text-right text-xs text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
