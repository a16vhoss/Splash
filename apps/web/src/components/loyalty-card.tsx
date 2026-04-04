interface LoyaltyCardProps {
  userName: string;
  stamps: number;
  stampsRequired: number;
  carWashName?: string;
}

export function LoyaltyCard({ userName, stamps, stampsRequired, carWashName }: LoyaltyCardProps) {
  const progress = Math.min((stamps / stampsRequired) * 100, 100);

  return (
    <div className="bg-gradient-to-br from-sidebar to-sidebar-muted rounded-[20px] p-5 text-white shadow-modal">
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="text-[10px] tracking-[2px] uppercase opacity-60">Programa de lealtad</div>
          <div className="text-xl font-extrabold mt-1">Splash Rewards</div>
          {carWashName && <div className="text-xs opacity-70 mt-0.5">{carWashName}</div>}
        </div>
        <span className="text-2xl">⭐</span>
      </div>

      {/* Stamps grid */}
      <div className="grid grid-cols-5 gap-2 mb-5">
        {Array.from({ length: stampsRequired }, (_, i) => (
          <div
            key={i}
            className={`aspect-square rounded-modal flex items-center justify-center text-sm font-bold ${
              i < stamps
                ? 'bg-accent/80 text-white'
                : i === stampsRequired - 1
                ? 'bg-white/15 text-white/30'
                : 'bg-white/15 text-white/50'
            }`}
          >
            {i < stamps ? '✓' : i === stampsRequired - 1 ? '🎁' : i + 1}
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs opacity-70">{userName}</span>
        <span className="text-xs font-semibold">{stamps} / {stampsRequired} sellos</span>
      </div>

      {/* Progress bar */}
      <div className="mt-3 bg-white/20 rounded-pill h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-accent to-primary h-full rounded-pill transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[10px] opacity-60 mt-2 text-center">
        {stamps >= stampsRequired
          ? '¡Tienes un lavado gratis disponible!'
          : `${stampsRequired - stamps} visitas más para tu lavado gratis`}
      </p>
    </div>
  );
}
