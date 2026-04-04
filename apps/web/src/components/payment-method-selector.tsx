'use client';

interface PaymentMethodSelectorProps {
  methods: string[];
  selected: string;
  onChange: (method: string) => void;
}

const METHOD_LABELS: Record<string, { label: string; icon: string }> = {
  efectivo: { label: 'Efectivo', icon: '💵' },
  tarjeta_sitio: { label: 'Tarjeta', icon: '💳' },
  transferencia: { label: 'Transferencia', icon: '🏦' },
  en_linea: { label: 'En linea', icon: '🌐' },
};

export function PaymentMethodSelector({ methods, selected, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="flex gap-2">
      {methods.map((method) => {
        const info = METHOD_LABELS[method] || { label: method, icon: '💰' };
        const isSelected = selected === method;
        return (
          <button
            key={method}
            onClick={() => onChange(method)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-card text-xs font-semibold transition-all ${
              isSelected
                ? 'bg-primary text-white border-2 border-primary'
                : 'bg-white text-foreground border border-border hover:border-primary/50'
            }`}
          >
            <span className="text-base">{info.icon}</span>
            {info.label}
          </button>
        );
      })}
    </div>
  );
}
