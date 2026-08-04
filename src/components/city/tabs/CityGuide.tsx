import {
  Award,
  Box,
  Check,
  Crosshair,
  Edit3,
  GripHorizontal,
  Loader2,
  MapPin,
  Navigation,
  PencilLine,
  Plus,
  ShoppingCart,
  Star,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react';
import { type MouseEvent, useEffect, useState } from 'react';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';
import { FavoriteBookmarkButton } from '@/components/myspace/FavoriteBookmarkButton';
import { PLAN_TYPES } from '@/constants/planTypes';
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import { useFeatureFlag } from '@/context/PlatformControlContext';
import { resolvePoiDisplayImageUrl } from '@/domain/poi/resolvePoiDisplayImageUrl';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { calculateDistance } from '@/services/geo';
import { getCategoryPlaceholders } from '@/services/settingsService';
import type { PointOfInterest, User } from '@/types';
import { getPoiColorStyle, getSubCategoryLabel, open3DView, openMap } from '@/utils/common';
import { useInteraction } from '../../../context/InteractionContext';

/**
 * Ordinale di dominio dello slot prezzo (€1…€5).
 * Lista fissa, mai riordinata/inserita/rimossa: la key è lo slot stesso, non un indice di array.
 */
const PRICE_LEVEL_SLOTS = [1, 2, 3, 4, 5] as const;

const PriceLevelIndicator = ({ level }: { level?: number }) => {
  const MAX_LEVEL = PRICE_LEVEL_SLOTS.length;
  const activeLevel = level ?? 0;

  return (
    <div
      className="flex h-full items-center justify-center gap-0.5"
      title={`Livello Prezzo: ${activeLevel}/${MAX_LEVEL}`}
    >
      {PRICE_LEVEL_SLOTS.map((slot) => {
        const isActive = slot <= activeLevel;
        const activeClass = 'text-amber-500';
        return (
          <span
            key={slot}
            className={`text-[10px] leading-none font-black ${isActive ? activeClass : 'text-slate-800'}`}
          >
            €
          </span>
        );
      })}
    </div>
  );
};

interface PoiListItemProps {
  poi: PointOfInterest;
  onOpenDetail: (poi: PointOfInterest) => void;
  onOpenShop: (poi: PointOfInterest) => void;
  onAddToItinerary: (poi: PointOfInterest) => void;
  isItemInItinerary: (id: string) => boolean;
  referencePoint: { lat: number; lng: number; name: string; id?: string } | null;
  userLocation: { lat: number; lng: number } | null;
  onSetReference: (e: MouseEvent, poi: PointOfInterest) => void;
  isMobile: boolean;
  onOpenAuth: () => void;
  onOpenReview: (poi: PointOfInterest) => void;
  user?: User;
  onAdminEdit?: (poi: PointOfInterest) => void;
}

const PoiListItem = ({
  poi,
  onOpenDetail,
  onOpenShop,
  onAddToItinerary,
  isItemInItinerary,
  referencePoint,
  userLocation,
  onSetReference,
  isMobile,
  onOpenAuth,
  onOpenReview,
  user,
  onAdminEdit,
}: PoiListItemProps) => {
  const shopPublicFlag = useFeatureFlag(PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_SHOP_PUBLIC);
  const shopPublicEnabled = shopPublicFlag?.enabled ?? true;
  const { hasUserVoted, toggleVote } = useInteraction();

  const titleStyle = useDynamicStyles('poi_card_title', isMobile);
  const descStyle = useDynamicStyles('poi_card_desc', isMobile);
  const distanceBadgeStyle = useDynamicStyles('poi_distance_badge', isMobile);

  const isVoted = hasUserVoted(poi.id);
  const inItinerary = isItemInItinerary(poi.id);
  const isAdmin = user && (user.role === 'admin_all' || user.role === 'admin_limited');

  const isRef =
    referencePoint && (referencePoint.id === poi.id || referencePoint.name === poi.name);
  const isGlobalRefActive = !!referencePoint;

  const [isVoting, setIsVoting] = useState(false);
  const [localVotes, setLocalVotes] = useState(poi.votes);

  useEffect(() => {
    setLocalVotes(poi.votes);
  }, [poi.votes]);

  const uiStyle = getPoiColorStyle(poi.category);

  const distFromUser =
    userLocation && poi.coords.lat !== 0
      ? calculateDistance(userLocation.lat, userLocation.lng, poi.coords.lat, poi.coords.lng)
      : null;

  const distFromRef =
    isGlobalRefActive && !isRef && poi.coords.lat !== 0
      ? calculateDistance(referencePoint.lat, referencePoint.lng, poi.coords.lat, poi.coords.lng)
      : null;

  const handleThumbClick = async (e: MouseEvent) => {
    e.stopPropagation();
    if (!user || user.role === 'guest') {
      onOpenAuth();
      return;
    }
    if (isVoting) return;
    setIsVoting(true);
    const newCount = await toggleVote(poi.id);
    if (newCount !== null) setLocalVotes(newCount);
    setIsVoting(false);
  };

  const handleReviewClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (!user || user.role === 'guest') {
      onOpenAuth();
      return;
    }
    onOpenReview(poi);
  };

  const imageUrl = resolvePoiDisplayImageUrl({
    imageUrl: poi.imageUrl,
    category: poi.category,
    categoryPlaceholders: getCategoryPlaceholders(),
  });

  const sideBtnClass = 'flex flex-1 flex-col items-center justify-center gap-1 transition-colors';
  const sideIconClass = 'h-4 w-4 md:h-5 md:w-5';
  const sideLabelClass = 'text-[7px] font-black uppercase';

  let interestColor = 'text-slate-500 border-slate-700 bg-slate-800/50';
  let interestLabel = 'N/C';

  if (poi.tourismInterest === 'high') {
    interestColor =
      'text-yellow-400 border-yellow-500/40 bg-yellow-950/20 shadow-[0_0_10px_rgba(250,204,21,0.1)]';
    interestLabel = 'TOP';
  } else if (poi.tourismInterest === 'medium') {
    interestColor = 'text-slate-300 border-slate-400/40 bg-slate-800/60';
    interestLabel = 'MED';
  } else if (poi.tourismInterest === 'low') {
    interestColor = 'text-orange-400 border-orange-800/60 bg-orange-950/20';
    interestLabel = 'LOW';
  }

  return (
    <div
      className={`group relative flex h-36 overflow-hidden rounded-2xl border bg-slate-900 transition-all md:h-44 ${poi.planType === PLAN_TYPES.REGIONAL_ACTIVITY ? 'border-amber-500 shadow-amber-900/20' : 'border-slate-800 shadow-md hover:border-slate-600'}`}
    >
      <div className="flex w-12 shrink-0 flex-col border-r border-slate-800 bg-[#0f172a] md:w-16">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openMap(poi.coords.lat, poi.coords.lng, poi.name, poi.address);
          }}
          className={`${sideBtnClass} border-b border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-amber-400`}
          title="Mappa"
        >
          <MapPin className={sideIconClass} />
          <span className={sideLabelClass}>MAPS</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            open3DView(poi.coords.lat, poi.coords.lng, poi.name, poi.address);
          }}
          className={`${sideBtnClass} border-b border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-indigo-400`}
          title="Vista 3D"
        >
          <Box className={sideIconClass} />
          <span className={sideLabelClass}>3D</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetReference(e, poi);
          }}
          className={`
                        ${sideBtnClass}
                        ${
                          isRef
                            ? 'border-blue-500 bg-blue-600 text-white'
                            : isGlobalRefActive && distFromRef !== null
                              ? 'border-cyan-500/30 bg-cyan-900/20 text-cyan-400'
                              : 'text-slate-500 hover:bg-slate-800 hover:text-blue-400'
                        }
                    `}
          title={isRef ? 'Riferimento Attivo' : 'Imposta come Riferimento'}
        >
          {isRef ? (
            <>
              <Crosshair className={sideIconClass} />
              <span className={sideLabelClass}>ATTIVO</span>
            </>
          ) : isGlobalRefActive && distFromRef !== null ? (
            <>
              <Navigation
                className={`h-4 w-4 rotate-45 transform ${
                  distanceBadgeStyle
                    ? distanceBadgeStyle
                        .split(' ')
                        .filter((c) => c.startsWith('text-'))
                        .join(' ')
                    : ''
                }`}
              />
              <span className={distanceBadgeStyle || sideLabelClass}>{distFromRef}KM</span>
            </>
          ) : (
            <>
              <Crosshair className={sideIconClass} />
              <span className={sideLabelClass}>DA QUI</span>
            </>
          )}
        </button>
      </div>

      <div className="relative flex min-w-0 flex-1 overflow-hidden">
        {/* Hit-area dettaglio/drag POI — button semantico sotto i controlli nested */}
        <button
          type="button"
          aria-label={`Apri dettagli ${poi.name}`}
          draggable={!isMobile}
          onDragStart={(e) => {
            if (isMobile) e.preventDefault();
            else e.dataTransfer.setData('application/json', JSON.stringify(poi));
          }}
          onClick={() => onOpenDetail(poi)}
          className={`absolute inset-0 z-0 border-0 bg-transparent p-0 ${!isMobile ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
        />

        <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 overflow-hidden">
          <div className="relative w-24 shrink-0 border-r border-slate-800/50 md:w-40">
            <ImageWithFallback
              src={imageUrl}
              alt={poi.name}
              category={poi.category}
              size="small"
              className="h-full w-full object-cover"
            />
            {poi.isSponsored && (
              <div className="absolute top-2 left-2">
                <span
                  className={`rounded border px-1.5 py-0.5 text-[7px] font-black uppercase shadow-lg ${poi.planType === PLAN_TYPES.REGIONAL_ACTIVITY ? 'border-amber-300 bg-amber-500 text-black' : 'border-slate-200 bg-white text-slate-900'}`}
                >
                  <Award className="h-2.5 w-2.5" /> SPONSOR
                </span>
              </div>
            )}

            {distFromUser !== null && (
              <div className="absolute top-2 left-1/2 z-local-overlay w-max max-w-[90%] -translate-x-1/2">
                <span
                  className={`flex items-center justify-center gap-0.5 rounded-full border border-emerald-500/50 bg-black/80 px-2 py-0.5 shadow-lg ring-1 ring-black/50 backdrop-blur-md whitespace-nowrap ${distanceBadgeStyle || 'text-[8px] font-black text-emerald-300 md:text-[9px]'}`}
                >
                  <Navigation className="h-2 w-2 rotate-45 transform fill-current" /> {distFromUser}
                  km
                </span>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black to-transparent p-1">
              <Star className="h-3 w-3 fill-current text-amber-500" />
              <span className="text-[10px] font-bold text-white">{poi.rating}</span>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col p-3">
            <div className="flex items-start justify-between">
              <div className="mr-2 flex min-w-0 flex-1 flex-col">
                <h4
                  className={`${titleStyle} truncate leading-none transition-colors group-hover:text-amber-400`}
                >
                  {poi.name}
                </h4>
                {poi.address && (
                  <div className="mt-1 flex items-center gap-1 truncate text-[9px] text-slate-400 md:text-[10px]">
                    <MapPin className="h-2.5 w-2.5 shrink-0 md:h-3 md:w-3" /> {poi.address}
                  </div>
                )}
                <div className="mt-1 mb-2 h-px w-full bg-gradient-to-r from-slate-800/0 via-slate-800 to-slate-800/0" />
              </div>

              <div className="pointer-events-auto flex shrink-0 items-center gap-2">
                <div
                  className={`hidden h-5 items-center gap-1.5 rounded border px-2 md:flex ${interestColor}`}
                >
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-[9px] leading-none font-black tracking-wider uppercase">
                    {interestLabel}
                  </span>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdminEdit?.(poi);
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-indigo-400 shadow-sm transition-all hover:bg-indigo-600 hover:text-white"
                    title="Modifica"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                )}
                {poi.vatNumber && onOpenShop && shopPublicEnabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenShop(poi);
                    }}
                    className="rounded-lg border border-indigo-400 bg-indigo-600 p-1.5 text-white shadow-md hover:bg-indigo-500"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <p
              className={`${descStyle || 'text-[11px] leading-relaxed text-slate-400 italic md:text-sm'} mb-2 line-clamp-2`}
            >
              "{poi.description || 'Nessuna descrizione.'}"
            </p>

            <div className="mt-auto">
              <div className="mb-2 h-px w-full bg-gradient-to-r from-slate-800/0 via-slate-800 to-slate-800/0" />
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-5 min-w-0 items-center gap-2">
                  <div className="flex h-full shrink-0 items-center rounded border border-amber-500/50 bg-slate-950/50 px-2">
                    <PriceLevelIndicator level={poi.priceLevel} />
                  </div>

                  <span
                    className={`flex h-full items-center truncate rounded border px-2 text-[8px] font-black tracking-wider uppercase md:text-[9px] ${uiStyle.bg} ${uiStyle.text} ${uiStyle.border}`}
                  >
                    {getSubCategoryLabel(poi.subCategory || '')}
                  </span>
                </div>

                <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">
                  <FavoriteBookmarkButton
                    userId={user?.role === 'guest' ? null : user?.id}
                    entityKind="poi"
                    entityId={poi.id}
                    onRequireAuth={onOpenAuth}
                    size="sm"
                  />
                  <div className="hidden items-center gap-3 lg:flex">
                    <div
                      className={`flex h-5 items-center gap-1.5 rounded border px-2 md:hidden ${interestColor}`}
                    >
                      <span className="text-[8px] leading-none font-black uppercase">
                        {interestLabel}
                      </span>
                    </div>

                    <div className="rounded p-1 text-slate-700 transition-all group-hover:bg-cyan-500/10 group-hover:text-cyan-400 group-hover:ring-1 group-hover:ring-cyan-500/50">
                      <GripHorizontal className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-12 shrink-0 flex-col border-l border-slate-800 bg-[#0f172a] md:w-16">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddToItinerary(poi);
          }}
          className={`${sideBtnClass} border-b border-slate-800 ${inItinerary ? 'bg-emerald-900/20 text-emerald-500' : 'text-slate-500 hover:bg-slate-800 hover:text-emerald-400'}`}
          title="Aggiungi"
        >
          {inItinerary ? (
            <Check className="h-4 w-4 md:h-5 md:w-5" />
          ) : (
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
          )}
          <span className={sideLabelClass}>ADD</span>
        </button>
        <button
          type="button"
          onClick={handleThumbClick}
          className={`${sideBtnClass} border-b border-slate-800 ${isVoted ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-blue-400'}`}
          title="Voto"
        >
          {isVoting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ThumbsUp className={`h-4 w-4 md:h-5 md:w-5 ${isVoted ? 'fill-current' : ''}`} />
          )}
          <span className={sideLabelClass}>{localVotes}</span>
        </button>
        <button
          type="button"
          onClick={handleReviewClick}
          className={`${sideBtnClass} text-slate-500 hover:text-amber-400`}
          title="Valuta"
        >
          <PencilLine className={sideIconClass} />
          <span className={sideLabelClass}>VALUTA</span>
        </button>
      </div>
    </div>
  );
};

interface CityGuideProps {
  pois: PointOfInterest[];
  /**
   * Accettata dal parent (`CityCategoryTab`) per compatibilità API.
   * Non usata qui: le colonne sponsor sono rese da `CategorySponsorColumn` nel parent.
   */
  sponsors: PointOfInterest[];
  userLocation: { lat: number; lng: number } | null;
  onAddToItinerary: (poi: PointOfInterest) => void;
  isItemInItinerary: (id: string) => boolean;
  referencePoint: { lat: number; lng: number; name: string; id?: string } | null;
  onSetReference: (e: MouseEvent, poi: PointOfInterest) => void;
  onOpenDetail: (poi: PointOfInterest) => void;
  onOpenShop: (poi: PointOfInterest) => void;
  /**
   * Accettata per compatibilità API; apertura sponsor gestita dal parent / colonne laterali.
   */
  onOpenSponsor: (type?: 'gold' | 'silver') => void;
  /**
   * Accettata per compatibilità API; layout sidebar gestito dallo shell UI, non da questa lista.
   */
  isSidebarOpen?: boolean;
  user?: User;
  onOpenAuth: () => void;
  onOpenReview: (poi: PointOfInterest) => void;
  onAdminEdit?: (poi: PointOfInterest) => void;
}

export const CityGuide = ({
  pois,
  userLocation,
  onAddToItinerary,
  isItemInItinerary,
  referencePoint,
  onSetReference,
  onOpenDetail,
  onOpenShop,
  user,
  onOpenAuth,
  onOpenReview,
  onAdminEdit,
}: CityGuideProps) => {
  // LG shell band — shared hook (avoids per-list resize listener / full-list rerenders).
  const isMobile = useMobileDetect();

  return (
    <div className="px-0 py-4 md:p-8 md:px-2">
      <div className="flex flex-col gap-6">
        {pois.map((poi) => (
          <PoiListItem
            key={poi.id}
            poi={poi}
            onOpenDetail={onOpenDetail}
            onOpenShop={onOpenShop}
            onAddToItinerary={onAddToItinerary}
            isItemInItinerary={isItemInItinerary}
            referencePoint={referencePoint}
            userLocation={userLocation}
            onSetReference={onSetReference}
            isMobile={isMobile}
            onOpenAuth={onOpenAuth}
            onOpenReview={onOpenReview}
            user={user}
            onAdminEdit={onAdminEdit}
          />
        ))}
      </div>
      {pois.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 py-20 text-center text-slate-500 italic">
          Nessun luogo trovato.
        </div>
      )}
    </div>
  );
};
