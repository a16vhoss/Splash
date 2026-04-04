interface LoyaltyMiniProps {
  stamps: number;
  stampsRequired: number;
}

export function LoyaltyMini({ stamps, stampsRequired }: LoyaltyMiniProps) {
  const remaining = stampsRequired - stamps;
  return (
    <div className="bg-warning/10 rounded-modal px-3 py-2 flex items-center gap-2">
      <span className="text-lg">⭐</span>
      <div>
        <div className="text-xs font-bold text-warning-foreground">{stamps} / {stampsRequired} sellos</div>
        <div className="text-[10px] text-warning-foreground/70">
          {remaining > 0 ? `${remaining} más para lavado gratis` : '¡Lavado gratis disponible!'}
        </div>
      </div>
    </div>
  );
}
