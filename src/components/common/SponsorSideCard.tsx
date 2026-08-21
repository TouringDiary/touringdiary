import { Award, Check, GripHorizontal, Plus } from 'lucide-react';
import type React from 'react';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { StarRating } from '@/components/common/StarRating';
import { PLAN_TYPES } from '@/constants/planTypes';
import { useItinerary } from '@/context/ItineraryContext';
import type { PointOfInterest } from '@/types';

export interface SponsorSideCardProps {
  poi: PointOfInterest;
  onOpenDetail: (poi: PointOfInterest) => void;
  onAddToItinerary: (poi: PointOfInterest) => void;
  className?: string;
}

/**
 * Card sponsor PARTNER — contratto prodotto Home (e Shop PARTNER):
 * - superficie libera → apre dettaglio POI;
 * - grip (desktop) → trascina nel Diario;
 * - + → aggiunge al Diario;
 * - nessun like / azioni secondarie sulla superficie.
 *
 * Layout/classi geometriche allineate all’ex HomeSideSponsorCard (HEAD):
 * non alterare sizing/aspect senza decisione prodotto.
 */
export const SponsorSideCard: React.FC<SponsorSideCardProps> = ({
  poi,
  onOpenDetail,
  onAddToItinerary,
  className = '',
}) => {
  const { itinerary } = useItinerary();
  const inItinerary = itinerary.items.some((i) => i.poi.id === poi.id);
  // Gold/Silver: planType SoT + tier runtime (stesso contratto visuale se type colonna diverge dal pricing).
  const isGold = poi.planType === PLAN_TYPES.REGIONAL_ACTIVITY || poi.tier === 'gold';
  const isSilver = poi.planType === PLAN_TYPES.LOCAL_ACTIVITY || poi.tier === 'silver';

  let borderColor = 'border border-slate-800 hover:border-slate-600';
  if (isGold)
    borderColor = 'border border-amber-500 hover:border-amber-400 ring-1 ring-amber-500/20';
  else if (isSilver)
    borderColor = 'border border-slate-200 hover:border-white ring-1 ring-white/10';

  let badge: React.ReactNode = (
    <span className="bg-slate-700 text-slate-300 text-[7px] font-bold px-1.5 py-0.5 rounded border border-slate-600 uppercase tracking-normal w-fit">
      SPONSOR
    </span>
  );
  if (isGold)
    badge = (
      <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(251,191,36,0.5)] uppercase tracking-normal flex items-center gap-0.5 border border-yellow-100">
        <Award className="w-2 h-2" /> SPONSOR
      </span>
    );
  else if (isSilver)
    badge = (
      <span className="bg-gradient-to-r from-slate-200 via-white to-slate-400 text-slate-900 text-[7px] font-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(255,255,255,0.2)] uppercase tracking-normal flex items-center gap-0.5 border border-white/50">
        <Award className="w-2 h-2" /> SPONSOR
      </span>
    );

  return (
    <div
      className={`group relative w-full h-full rounded-xl border overflow-hidden cursor-default transition-all bg-slate-900 shadow-lg shrink-0 ${borderColor} ${className}`}
    >
      {/* Superficie principale: button fratello (non contenitore) dei controlli. */}
      <button
        type="button"
        onClick={() => onOpenDetail(poi)}
        className="absolute inset-0 z-0 cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-inset"
        aria-label={`Apri dettaglio ${poi.name}`}
      />

      {/* Layer media: stesse classi geometriche dell’originale HomeSideSponsorCard */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0" aria-hidden>
        <ImageWithFallback
          src={poi.imageUrl}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100 select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 pointer-events-none" />
      </div>

      <div className="absolute top-2 right-2 z-home-card-overlay pointer-events-none">{badge}</div>

      <div className="absolute top-3 left-4 z-home-card-overlay flex flex-col items-start pr-12 pointer-events-none max-w-full">
        <div className="mb-0.5">
          <StarRating value={poi.rating} size="w-3 h-3" showValue={false} />
        </div>
        <h4
          className={`text-white font-display font-bold text-sm md:text-lg leading-tight drop-shadow-md ${isGold ? 'text-amber-50' : ''}`}
        >
          {poi.name}
        </h4>
      </div>

      <div className="absolute bottom-2 right-2 z-home-card-overlay flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
        <button
          type="button"
          className="hidden lg:flex p-1.5 rounded-lg bg-black/50 hover:bg-indigo-600 text-slate-300 hover:text-white backdrop-blur-sm cursor-grab active:cursor-grabbing border border-white/10 transition-all shadow-lg"
          draggable="true"
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.setData('text/plain', JSON.stringify(poi));
            e.dataTransfer.effectAllowed = 'copy';
          }}
          title="Trascina nel diario"
          aria-label="Trascina nel Diario"
        >
          <GripHorizontal className="w-3.5 h-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onAddToItinerary(poi)}
          className={`rounded-lg text-white shadow-lg border transition-colors cursor-pointer pointer-events-auto flex items-center justify-center w-9 h-9 ${inItinerary ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500' : 'bg-amber-600 hover:bg-amber-500 border-amber-500'}`}
          title={inItinerary ? 'Aggiunto' : 'Aggiungi al diario'}
          aria-label={inItinerary ? 'Aggiunto al diario' : 'Aggiungi al diario'}
        >
          {inItinerary ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
