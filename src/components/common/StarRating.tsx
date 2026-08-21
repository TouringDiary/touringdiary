import { Star, StarHalf } from 'lucide-react';

interface Props {
  /** Assente o undefined = nessuna valutazione (tratta come 0 in UI). */
  value?: number;
  max?: number; // Numero massimo di stelle (default 5)
  size?: string; // Classi Tailwind per la dimensione (es. "w-4 h-4")
  activeColor?: string; // Colore stelle attive (Tailwind text class)
  fillColor?: string; // Colore riempimento (Tailwind fill class)
  inactiveColor?: string; // Colore stelle inattive
  showValue?: boolean; // Mostra il valore numerico accanto
}

export const StarRating = ({
  value,
  max = 5,
  size = 'w-3 h-3',
  activeColor = 'text-amber-400',
  fillColor = 'fill-amber-400',
  inactiveColor = 'text-slate-600',
  showValue = false,
}: Props) => {
  const safeValue = value ?? 0;
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`Valutazione: ${safeValue} su ${max}`}
    >
      {[...Array(max)].map((_, i) => {
        const isFull = safeValue >= i + 1;
        const isHalf = safeValue >= i + 0.5 && safeValue < i + 1;

        return (
          <div key={i} className="relative">
            {/* Stella Sfondo (Vuota) */}
            <Star className={`${size} ${inactiveColor}`} />

            {/* Stella Piena (Overlay) */}
            {isFull && (
              <Star className={`${size} ${activeColor} ${fillColor} absolute top-0 left-0`} />
            )}

            {/* Mezza Stella (Overlay) */}
            {isHalf && (
              <StarHalf className={`${size} ${activeColor} ${fillColor} absolute top-0 left-0`} />
            )}
          </div>
        );
      })}
      {showValue && <span className="ml-1 text-xs font-bold text-slate-300">{safeValue}</span>}
    </div>
  );
};
