import { Award, Check, GripHorizontal, MapPin, Navigation, Plus, ThumbsUp } from 'lucide-react';
import type React from 'react';
import {
  isSponsorGold,
  isSponsorSilver,
  SPONSOR_GOLD_BADGE_CLASS,
  SPONSOR_SILVER_BADGE_CLASS,
  SPONSOR_TIER_BORDER,
  sponsorTierBorderClass,
} from '@/components/common/sponsorCardVisuals';
import { useItinerary } from '@/context/ItineraryContext';
import { resolvePoiDisplayImageUrl } from '@/domain/poi/resolvePoiDisplayImageUrl';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useDynamicStyles } from '../../hooks/useDynamicStyles';
import { calculateDistance } from '../../services/geo';
import { getCategoryPlaceholders } from '../../services/settingsService';
import type { PointOfInterest } from '../../types/index';
import { getPoiColorStyle, getSubCategoryLabel, isPoiNew } from '../../utils/common';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { StarRating } from '../common/StarRating';

// --- TYPES ---
interface UniversalCardProps {
  poi: PointOfInterest;
  onOpenDetail: (poi: PointOfInterest) => void;
  onAddToItinerary: (poi: PointOfInterest) => void;
  onLike?: (poi: PointOfInterest) => void;
  isLiked?: boolean;
  userLocation?: { lat: number; lng: number } | null;

  // Variant Props
  variant?: 'horizontal' | 'vertical';
  fluid?: boolean;
  verticalStretch?: boolean;
}

// --- SUB-COMPONENTS ---

// Indicatore Prezzo (€€€€)
const PriceLevelIndicator = ({ level }: { level?: number }) => {
  const MAX_LEVEL = 5;
  const activeLevel = level || 0;
  return (
    <div
      className="flex gap-0.5 items-center justify-center h-full"
      title={`Livello Prezzo: ${activeLevel}/${MAX_LEVEL}`}
    >
      {[...Array(MAX_LEVEL)].map((_, index) => (
        <span
          key={index}
          className={`text-[10px] font-black leading-none ${index < activeLevel ? 'text-amber-500' : 'text-slate-800'}`}
        >
          €
        </span>
      ))}
    </div>
  );
};

// Action Buttons Row (Like, Add, Drag Handle)
interface ActionRowProps {
  poi: PointOfInterest;
  onLike?: (poi: PointOfInterest) => void;
  isLiked?: boolean;
  onAdd: (poi: PointOfInterest) => void;
  inItinerary: boolean;
  variant: 'horizontal' | 'vertical';
}

const ActionRow = ({ poi, onLike, isLiked, onAdd, inItinerary, variant }: ActionRowProps) => (
  <div
    className={`absolute z-local-overlay flex items-center gap-1.5 pointer-events-auto ${variant === 'horizontal' ? 'bottom-2 right-2' : 'bottom-1 right-0 p-2'}`}
  >
    {variant === 'horizontal' && (
      <button
        type="button"
        draggable
        title="Trascina nel diario"
        aria-label="Trascina nel diario"
        onClick={(e) => e.stopPropagation()}
        onDragStart={(e) => {
          const payload = JSON.stringify(poi);
          e.dataTransfer.setData('application/json', payload);
          e.dataTransfer.setData('text/plain', payload);
        }}
        className="hidden lg:flex p-1.5 rounded-lg bg-black/40 text-slate-500 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripHorizontal className="w-4 h-4 group-hover:text-amber-500 transition-colors" />
      </button>
    )}
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onLike?.(poi);
      }}
      className={`p-2 rounded-lg shadow-lg border transition-all flex items-center justify-center min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0 lg:w-7 lg:h-7 lg:p-1.5 active:scale-90 ${isLiked ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/60 border-white/10 text-slate-300 hover:text-white'}`}
    >
      <ThumbsUp className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
    </button>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onAdd(poi);
      }}
      className={`p-2 rounded-lg shadow-lg border transition-all flex items-center justify-center min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0 lg:w-7 lg:h-7 lg:p-1.5 active:scale-90 ${inItinerary ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-amber-600 border-amber-500 text-white'}`}
    >
      {inItinerary ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
    </button>
  </div>
);

// --- MAIN COMPONENT ---
export const UniversalCard: React.FC<UniversalCardProps> = ({
  poi,
  onOpenDetail,
  onAddToItinerary,
  onLike,
  isLiked,
  userLocation,
  variant = 'vertical',
  fluid = false,
  verticalStretch = false,
}) => {
  // Context Hooks
  const { itinerary } = useItinerary();
  const inItinerary = itinerary.items.some((i) => i.poi.id === poi.id);
  const ui = getPoiColorStyle(poi.category);
  const isGold = isSponsorGold(poi);
  const isSilver = isSponsorSilver(poi);
  const showGoldChrome = Boolean(poi.isSponsored && isGold);
  const tierBorder = poi.isSponsored ? sponsorTierBorderClass(poi) : SPONSOR_TIER_BORDER.default;

  // Typography responsive (tipografia); drag handle = solo Tailwind `hidden lg:flex`
  const isMobile = useMobileDetect();
  const titleStyle = useDynamicStyles('poi_card_title', isMobile);
  const distanceBadgeStyle = useDynamicStyles('poi_distance_badge', isMobile);

  // Distance Calculation — (0,0) is domain placeholder, not a real point; single 0 coord is valid.
  const coords = poi.coords;
  const distanceRel =
    userLocation &&
    coords &&
    Number.isFinite(coords.lat) &&
    Number.isFinite(coords.lng) &&
    !(coords.lat === 0 && coords.lng === 0)
      ? calculateDistance(userLocation.lat, userLocation.lng, coords.lat, coords.lng)
      : null;
  const showDistance = distanceRel !== null;

  const imageUrl = resolvePoiDisplayImageUrl({
    imageUrl: poi.imageUrl,
    category: poi.category,
    categoryPlaceholders: getCategoryPlaceholders(),
  });

  const sponsorBadge = poi.isSponsored ? (
    isGold ? (
      <span className={SPONSOR_GOLD_BADGE_CLASS}>
        <Award className="w-2 h-2" aria-hidden /> SPONSOR
      </span>
    ) : isSilver ? (
      <span className={SPONSOR_SILVER_BADGE_CLASS}>
        <Award className="w-2 h-2" aria-hidden /> SPONSOR
      </span>
    ) : (
      <span className="bg-white text-slate-900 text-[7px] font-black px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-normal inline-flex items-center gap-0.5">
        <Award className="w-2 h-2" aria-hidden /> SPONSOR
      </span>
    )
  ) : null;

  // --- LAYOUT: HORIZONTAL (Top 5 Lists) ---
  if (variant === 'horizontal') {
    return (
      <div
        className={`group relative h-36 md:h-44 w-full rounded-xl overflow-hidden border transition-all bg-slate-900 shadow-md hover:shadow-xl ${tierBorder}`}
      >
        <button
          type="button"
          aria-label={`Apri dettagli ${poi.name}`}
          onClick={() => onOpenDetail(poi)}
          className="absolute inset-0 z-0 cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-inset"
        />
        <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
          <ImageWithFallback
            src={imageUrl}
            alt=""
            category={poi.category}
            size="medium"
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90"></div>
        </div>

        {sponsorBadge && (
          <div className="absolute top-2 right-2 z-[1] pointer-events-none">{sponsorBadge}</div>
        )}

        {showDistance && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-local-overlay pointer-events-none">
            <span
              className={`flex items-center justify-center gap-0.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-500/50 shadow-sm whitespace-nowrap ${distanceBadgeStyle || 'text-[8px] font-black text-emerald-300'}`}
            >
              <Navigation className="w-2 h-2 fill-current transform rotate-45" /> {distanceRel}km
            </span>
          </div>
        )}

        <div className="absolute top-3 left-3 z-[1] flex flex-col items-start pr-12 w-full pointer-events-none">
          <StarRating value={poi.rating} size="w-3 h-3" />
          <h4
            className={`${showGoldChrome ? 'text-amber-50' : 'text-white'} font-bold leading-none group-hover:text-amber-400 transition-colors mt-1 truncate w-full pr-12 ${titleStyle || 'text-sm md:text-xl'}`}
          >
            {poi.name}
          </h4>
          {poi.address && (
            <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[80%]">
              <MapPin className="w-3 h-3 shrink-0" /> {poi.address}
            </div>
          )}
        </div>

        <div className="absolute bottom-3 left-3 z-[1] flex flex-col gap-1 pointer-events-none">
          <span
            className={`text-[8px] font-black uppercase h-4 px-2 rounded-sm border flex items-center leading-none ${ui.bg} ${ui.text} ${ui.border}`}
          >
            {getSubCategoryLabel(poi.subCategory || '')}
          </span>
        </div>

        <ActionRow
          poi={poi}
          onLike={onLike}
          isLiked={isLiked}
          onAdd={onAddToItinerary}
          inItinerary={inItinerary}
          variant="horizontal"
        />
      </div>
    );
  }

  // --- LAYOUT: VERTICAL (Grids & Sidebars) ---
  // Logica dimensionamento elastico
  const containerClasses = verticalStretch
    ? 'h-full min-h-0 w-full'
    : `${fluid ? 'w-full' : 'w-72 md:w-72'} h-36 md:h-44`;

  const imageContainerClasses = verticalStretch ? 'flex-[0_0_50%] min-h-0' : 'h-[60%]';

  return (
    <div
      className={`group relative ${containerClasses} rounded-xl overflow-hidden transition-all bg-slate-900 shadow-md hover:shadow-lg border flex flex-col ${tierBorder}`}
    >
      <button
        type="button"
        aria-label={`Apri dettagli ${poi.name}`}
        onClick={() => onOpenDetail(poi)}
        className="absolute inset-0 z-0 cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-inset"
      />
      {/* IMMAGINE */}
      <div
        className={`relative ${imageContainerClasses} overflow-hidden bg-black shrink-0 pointer-events-none z-[1]`}
        aria-hidden
      >
        <ImageWithFallback
          src={imageUrl}
          alt=""
          category={poi.category}
          size="small"
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>

        {/* Badge Overlay */}
        <div className="absolute top-2 right-2 flex justify-end mb-1 z-local-overlay">
          {sponsorBadge
            ? sponsorBadge
            : isPoiNew(poi) && (
                <span className="bg-purple-600 text-white text-[7px] font-black px-2 py-0.5 rounded uppercase border border-purple-400">
                  Novità
                </span>
              )}
        </div>

        {/* Distance Badge */}
        {showDistance && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-local-overlay pointer-events-none">
            <span
              className={`flex items-center justify-center gap-0.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-500/50 shadow-sm whitespace-nowrap ${distanceBadgeStyle || 'text-[8px] font-black text-emerald-300'}`}
            >
              <Navigation className="w-2 h-2 fill-current transform rotate-45" /> {distanceRel}km
            </span>
          </div>
        )}
      </div>

      {/* CONTENUTO */}
      <div className="relative z-local-raised p-2 md:p-3 flex flex-col flex-1 min-h-0 justify-between pointer-events-none">
        <div className="w-full min-h-0 flex-1">
          <StarRating value={poi.rating} size="w-2.5 h-2.5" />
          <h4
            className={`${showGoldChrome ? 'text-amber-50' : 'text-white'} font-bold leading-tight mt-0.5 line-clamp-2 pr-2 ${titleStyle || 'text-sm md:text-lg'}`}
          >
            {poi.name}
          </h4>
          {poi.address && (
            <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[90%]">
              <MapPin className="w-2.5 h-2.5 shrink-0" /> {poi.address}
            </div>
          )}
        </div>

        {/* FOOTER CARD */}
        <div className="flex justify-between items-end mt-1 shrink-0 relative">
          <div className="flex items-center gap-2">
            {poi.priceLevel && (
              <div className="bg-slate-950/50 border border-slate-800 rounded px-1.5 py-0.5">
                <PriceLevelIndicator level={poi.priceLevel} />
              </div>
            )}
            <span
              className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-sm border ${ui.bg} ${ui.text} ${ui.border}`}
            >
              {getSubCategoryLabel(poi.subCategory || '')}
            </span>
          </div>

          <ActionRow
            poi={poi}
            onLike={onLike}
            isLiked={isLiked}
            onAdd={onAddToItinerary}
            inItinerary={inItinerary}
            variant="vertical"
          />
        </div>
      </div>
    </div>
  );
};

// Export Compatibility Aliases
export const HorizontalCard = (props: UniversalCardProps) => (
  <UniversalCard {...props} variant="horizontal" />
);
export const CompactDiscoveryCard = (props: UniversalCardProps) => (
  <UniversalCard {...props} variant="vertical" />
);
export const VerticalCompactCard = (props: UniversalCardProps) => (
  <UniversalCard {...props} variant="vertical" fluid={false} />
);
