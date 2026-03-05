
import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface Props {
    value: number; // Valore della valutazione (solitamente 0-5)
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
    size = "w-3 h-3", 
    activeColor = "text-amber-400", 
    fillColor = "fill-amber-400",
    inactiveColor = "text-slate-600",
    showValue = false
}: Props) => {
    return (
        <div className="flex items-center gap-0.5" aria-label={`Valutazione: ${value} su ${max}`}>
            {[...Array(max)].map((_, i) => {
                const isFull = value >= i + 1;
                const isHalf = value >= i + 0.5 && value < i + 1;

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
            {showValue && <span className="ml-1 text-xs font-bold text-slate-300">{value}</span>}
        </div>
    );
};
