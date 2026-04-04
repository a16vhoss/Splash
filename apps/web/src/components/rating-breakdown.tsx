interface RatingBreakdownProps {
  overall: number;
  totalReviews: number;
  servicio?: number | null;
  limpieza?: number | null;
  tiempo?: number | null;
  valor?: number | null;
}

function RatingBar({ label, value }: { label: string; value: number | null | undefined }) {
  const val = value ?? 0;
  const pct = (val / 5) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-16">{label}</span>
      <div className="flex-1 bg-border rounded-pill h-2">
        <div className="bg-accent rounded-pill h-2 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-foreground w-6 text-right">{val > 0 ? val.toFixed(1) : '—'}</span>
    </div>
  );
}

export function RatingBreakdown({ overall, totalReviews, servicio, limpieza, tiempo, valor }: RatingBreakdownProps) {
  const hasDetailed = servicio != null || limpieza != null || tiempo != null || valor != null;

  return (
    <div className="flex gap-6 p-4 bg-white rounded-modal border border-border">
      <div className="text-center flex-shrink-0">
        <div className="text-4xl font-extrabold text-foreground">{Number(overall).toFixed(1)}</div>
        <div className="text-xs text-muted-foreground mt-1">{totalReviews} resenas</div>
      </div>
      {hasDetailed && (
        <div className="flex-1 flex flex-col gap-1.5 justify-center">
          <RatingBar label="Servicio" value={servicio} />
          <RatingBar label="Limpieza" value={limpieza} />
          <RatingBar label="Tiempo" value={tiempo} />
          <RatingBar label="Valor" value={valor} />
        </div>
      )}
    </div>
  );
}
