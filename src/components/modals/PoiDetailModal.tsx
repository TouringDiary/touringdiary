import {
  Box,
  Bus,
  Check,
  Globe,
  Loader2,
  type LucideIcon,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Settings,
  ShoppingCart,
  Star,
  ThumbsUp,
  TrendingUp,
  User,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FavoriteBookmarkButton } from '@/components/myspace/FavoriteBookmarkButton';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { resolveResourceType } from '@/constants/planTypes';
import { PLATFORM_FEATURE_FLAG_KEYS } from '@/constants/platformFeatureFlags';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { useFeatureFlag } from '@/context/PlatformControlContext';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { useInteraction } from '../../context/InteractionContext';
import { useDynamicStyles } from '../../hooks/useDynamicStyles';
import { affiliateTrackingService } from '../../services/affiliateTrackingService';
import { calculateDistance } from '../../services/geo';
import type { PointOfInterest, User as UserType } from '../../types/index';
import { getPoiColorStyle, getSubCategoryLabel, open3DView, openMap } from '../../utils/common';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { StarRating } from '../common/StarRating';

// Imported Sub-Components
import { PoiImageSection as GallerySection } from './poiDetail/PoiImageSection'; // Rename for clarity
import { PoiInfoSection as TextSection } from './poiDetail/PoiInfoSection';

interface PoiDetailModalProps {
  poi: PointOfInterest;
  onClose: () => void;
  /** Se omesso (es. preview admin), il CTA diario resta nascosto. */
  onToggleItinerary?: (poi: PointOfInterest) => void;
  isInItinerary: boolean;
  /** Se omesso, il flusso recensioni resta nascosto. */
  onOpenReview?: () => void;
  userLocation: { lat: number; lng: number } | null;
  onSuggestEdit?: (poiName: string) => void;
  onOpenShop?: (poi: PointOfInterest) => void;
  user: UserType;
  /** Se omesso, le azioni che richiedono auth non aprono il login. */
  onOpenAuth?: () => void;
  initialView?: 'details' | 'reviews';
}

/** Coordinate realmente utilizzabili per Maps/3D/distanza (niente placeholder 0,0). */
const hasUsableCoords = (
  coords: PointOfInterest['coords'] | undefined,
): coords is { lat: number; lng: number } => {
  if (!coords) return false;
  const { lat, lng } = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
};

export const PoiDetailModal = ({
  poi,
  onClose,
  onToggleItinerary,
  isInItinerary,
  onOpenReview,
  userLocation,
  onSuggestEdit,
  onOpenShop,
  user,
  onOpenAuth,
  initialView = 'details',
}: PoiDetailModalProps) => {
  // ESC Handling
  useGlobalModalEscape(!!poi, onClose);

  // --- 1. DETERMINA TIPO VISTA (BUSINESS VS STANDARD) ---
  const isResource =
    Boolean(poi.resourceType) || (poi.category === 'leisure' && poi.subCategory === 'agency');

  const modalContent = isResource ? (
    <BusinessView {...{ poi, onClose, onToggleItinerary, isInItinerary, user, onOpenAuth }} />
  ) : (
    <StandardView
      {...{
        poi,
        onClose,
        onToggleItinerary,
        isInItinerary,
        onOpenReview,
        userLocation,
        onSuggestEdit,
        onOpenShop,
        user,
        onOpenAuth,
        initialView,
      }}
    />
  );

  return createPortal(modalContent, document.body);
};

interface BusinessViewProps {
  poi: PointOfInterest;
  onClose: () => void;
  onToggleItinerary?: (poi: PointOfInterest) => void;
  isInItinerary: boolean;
  user: UserType;
  onOpenAuth?: () => void;
}

type BusinessResourceThemeKey = NonNullable<PointOfInterest['resourceType']> | 'default';

interface BusinessResourceTheme {
  gradient: string;
  border: string;
  text: string;
  bg: string;
  icon: LucideIcon;
  label: string;
}

// --- SUB-COMPONENT: BUSINESS VIEW (EX BUSINESS CARD MODAL) ---
const BusinessView = ({
  poi,
  onClose,
  onToggleItinerary,
  isInItinerary,
  user,
  onOpenAuth,
}: BusinessViewProps) => {
  const runtimeResource = poi.resourceType ?? resolveResourceType(poi.planType);
  const favoriteEntityKind =
    runtimeResource === 'guide'
      ? 'guide'
      : runtimeResource === 'operator'
        ? 'tour_operator'
        : 'poi';

  const CONFIG: Record<BusinessResourceThemeKey, BusinessResourceTheme> = {
    guide: {
      gradient: 'from-indigo-600 to-purple-700',
      border: 'border-indigo-500/50',
      text: 'text-indigo-400',
      bg: 'bg-indigo-900/20',
      icon: User,
      label: 'Guida Turistica',
    },
    operator: {
      gradient: 'from-cyan-600 to-blue-700',
      border: 'border-cyan-500/50',
      text: 'text-cyan-400',
      bg: 'bg-cyan-900/20',
      icon: Bus,
      label: 'Tour Operator',
    },
    service: {
      gradient: 'from-sky-600 to-blue-600',
      border: 'border-sky-500/50',
      text: 'text-sky-400',
      bg: 'bg-sky-900/20',
      icon: Settings,
      label: 'Servizio',
    },
    default: {
      gradient: 'from-slate-700 to-slate-900',
      border: 'border-slate-600',
      text: 'text-slate-400',
      bg: 'bg-slate-900',
      icon: Star,
      label: 'Partner',
    },
  };

  const type: BusinessResourceThemeKey = poi.resourceType ?? 'default';
  const theme = CONFIG[type];
  const ThemeIcon = theme.icon;
  const hasRating = (poi.rating ?? 0) > 0;

  const handleWebsiteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!poi.contactInfo?.website) return;

    affiliateTrackingService.trackClickOut({
      partnerId: 'website',
      sourceType: 'poi',
      category: 'business_website',
      poiId: poi.id,
    });

    window.open(poi.contactInfo.website, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="td-modal-overlay bg-black/90 backdrop-blur-md !p-4 animate-in fade-in"
      style={{ zIndex: Z_OVERLAY }}
      role="presentation"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
        onClick={onClose}
      />
      <div
        className={`relative bg-[#0b0f1a] w-full max-w-sm max-h-[calc(100dvh-2rem)] rounded-[2.5rem] border-2 ${theme.border} shadow-2xl overflow-hidden flex flex-col pointer-events-auto`}
        style={{ zIndex: Z_MODAL }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="poi-business-title"
      >
        <div
          className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-br ${theme.gradient} opacity-20 shrink-0`}
        ></div>
        <CloseButton
          onClose={onClose}
          position="absolute"
          variant="primary"
          className="!bg-black/40 hover:!bg-red-600 backdrop-blur-sm z-dropdown"
        />
        <div className="absolute top-4 left-4 z-dropdown">
          <FavoriteBookmarkButton
            userId={user?.role === 'guest' ? null : user?.id}
            entityKind={favoriteEntityKind}
            entityId={poi.id}
            onRequireAuth={onOpenAuth}
            size="sm"
          />
        </div>

        <div className="relative flex flex-col items-center pt-12 pb-8 px-6 text-center overflow-y-auto min-h-0 flex-1 overscroll-contain">
          <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-br from-white/20 to-transparent mb-4 shadow-2xl">
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 border-4 border-[#0b0f1a] relative">
              {poi.imageUrl && !poi.imageUrl.includes('ui-avatars') ? (
                <ImageWithFallback
                  src={poi.imageUrl}
                  alt={poi.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                  <ThemeIcon className={`w-12 h-12 ${theme.text}`} />
                </div>
              )}
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-3 ${theme.bg} ${theme.text} ${theme.border}`}
          >
            {theme.label}
          </div>
          <h2
            id="poi-business-title"
            className="text-2xl font-display font-bold text-white mb-2 leading-tight"
          >
            {poi.name}
          </h2>
          {hasRating ? (
            <div className="flex items-center gap-2 mb-6 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">
              <StarRating value={poi.rating} size="w-3.5 h-3.5" />
              <span className="text-xs font-bold text-slate-400">({poi.votes ?? 0})</span>
            </div>
          ) : (
            <div className="mb-6 text-xs font-bold text-slate-500 uppercase tracking-widest">
              Nessuna valutazione
            </div>
          )}
          <div className="text-sm text-slate-300 font-serif italic leading-relaxed mb-8 px-2 line-clamp-4">
            {poi.description ? `"${poi.description}"` : 'Nessuna descrizione disponibile.'}
          </div>

          <div className="w-full grid grid-cols-2 gap-3 mb-8">
            {poi.contactInfo?.phone && (
              <a
                href={`tel:${poi.contactInfo.phone}`}
                className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-900/10 transition-colors group"
              >
                <Phone className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-white">
                  Chiama
                </span>
              </a>
            )}
            {poi.contactInfo?.email && (
              <a
                href={`mailto:${poi.contactInfo.email}`}
                className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-blue-500/50 hover:bg-blue-900/10 transition-colors group"
              >
                <Mail className="w-5 h-5 text-slate-400 group-hover:text-blue-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-white">
                  Email
                </span>
              </a>
            )}
            {poi.contactInfo?.website && (
              <button
                type="button"
                onClick={handleWebsiteClick}
                className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-purple-500/50 hover:bg-purple-900/10 transition-colors group col-span-2"
              >
                <Globe className="w-5 h-5 text-slate-400 group-hover:text-purple-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-white">
                  Visita Sito Web
                </span>
              </button>
            )}
            {!poi.contactInfo?.phone &&
              !poi.contactInfo?.email &&
              !poi.contactInfo?.website &&
              poi.address && (
                <div className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 col-span-2">
                  <MapPin className="w-5 h-5 text-slate-500 mb-1" />
                  <span className="text-[10px] text-slate-400 text-center">{poi.address}</span>
                </div>
              )}
          </div>

          {onToggleItinerary && (
            <button
              type="button"
              onClick={() => onToggleItinerary(poi)}
              className={`w-full py-4 min-h-[44px] rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${isInItinerary ? 'bg-emerald-600 text-white' : `bg-gradient-to-r ${theme.gradient} text-white`}`}
            >
              {isInItinerary ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}{' '}
              {isInItinerary ? 'Salvato nel Diario' : 'Aggiungi al Diario'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: STANDARD VIEW (EX POI DETAIL MODAL) ---
const StandardView = ({
  poi,
  onClose,
  onToggleItinerary,
  isInItinerary,
  onOpenReview,
  userLocation,
  onSuggestEdit,
  onOpenShop,
  user,
  onOpenAuth,
  initialView,
}: PoiDetailModalProps) => {
  const { hasUserVoted, toggleVote } = useInteraction();
  const shopPublicFlag = useFeatureFlag(PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_SHOP_PUBLIC);
  const shopPublicEnabled = shopPublicFlag?.enabled ?? true;
  const isMobile = useMobileDetect();
  const distanceBadgeStyle = useDynamicStyles('poi_distance_badge', isMobile);
  const [isFlipped, setIsFlipped] = useState(initialView === 'reviews');
  const [isVoting, setIsVoting] = useState(false);
  const [localVotes, setLocalVotes] = useState(poi.votes ?? 0);

  // FeatureModals/Sponsor possono aggiornare `poi` senza remount: allinea i voti locali.
  useEffect(() => {
    if (!poi.id) return;
    setLocalVotes(poi.votes ?? 0);
  }, [poi.id, poi.votes]);

  const uiStyle = useMemo(() => getPoiColorStyle(poi.category), [poi.category]);
  const usableCoords = hasUsableCoords(poi.coords) ? poi.coords : null;
  const distance =
    userLocation && usableCoords
      ? calculateDistance(userLocation.lat, userLocation.lng, usableCoords.lat, usableCoords.lng)
      : null;
  const isVoted = hasUserVoted(poi.id);

  const handleThumbClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || user.role === 'guest') {
      onOpenAuth?.();
      return;
    }
    if (isVoting) return;
    setIsVoting(true);
    try {
      const newCount = await toggleVote(poi.id);
      if (newCount !== null) setLocalVotes(newCount);
    } finally {
      setIsVoting(false);
    }
  };

  let interestColor = 'bg-slate-800 text-slate-500 border-slate-700';
  let interestLabel = 'N/C';
  if (poi.tourismInterest === 'high') {
    interestColor =
      'bg-yellow-950/40 text-yellow-400 border-yellow-500/40 shadow-[0_0_10px_rgba(250,204,21,0.1)]';
    interestLabel = 'TOP LEVEL';
  } else if (poi.tourismInterest === 'medium') {
    interestColor = 'bg-slate-800/60 text-slate-300 border-slate-400/40';
    interestLabel = 'MED';
  } else if (poi.tourismInterest === 'low') {
    interestColor = 'bg-orange-950/40 text-orange-400 border-orange-800/60';
    interestLabel = 'LOW LEVEL';
  }

  const poiDetailCategoryBadgeClass = `min-w-0 max-w-full shrink truncate rounded-lg border px-3 py-1 text-[10px] font-black uppercase leading-none tracking-widest shadow-lg ${uiStyle.bg} ${uiStyle.text} ${uiStyle.border}`;
  const subCategoryLabel = getSubCategoryLabel(poi.subCategory || '');

  const poiDetailHeaderActionBtnClass =
    'flex shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 py-1 text-[10px] font-bold uppercase leading-none transition-all min-h-9 lg:min-h-0';
  const poiDetailCompactHeaderActionBtnClass =
    'flex min-h-9 shrink-0 items-center justify-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase leading-none transition-all';
  const poiDetailHeaderActionBtnNeutralClass = `${poiDetailHeaderActionBtnClass} bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500`;
  const poiDetailCompactHeaderActionBtnNeutralClass = `${poiDetailCompactHeaderActionBtnClass} bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500`;

  const renderHeaderUtilityActions = (includeShop: boolean, compact = false) => {
    const actionBtnClass = compact
      ? poiDetailCompactHeaderActionBtnClass
      : poiDetailHeaderActionBtnClass;
    const neutralBtnClass = compact
      ? poiDetailCompactHeaderActionBtnNeutralClass
      : poiDetailHeaderActionBtnNeutralClass;

    return (
      <>
        {includeShop && poi.vatNumber && onOpenShop && shopPublicEnabled && (
          <button
            type="button"
            onClick={() => {
              onOpenShop(poi);
              onClose();
            }}
            className={`${neutralBtnClass} bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95 border-indigo-400`}
            title="Vai alla Bottega"
            aria-label="Vai alla Bottega"
          >
            <ShoppingCart className="w-4 h-4" aria-hidden />
          </button>
        )}
        {usableCoords ? (
          <>
            <button
              type="button"
              onClick={() => openMap(usableCoords.lat, usableCoords.lng, poi.name, poi.address)}
              className={neutralBtnClass}
              title="Apri mappa"
              aria-label="Apri mappa"
            >
              <MapPin className={compact ? 'h-3 w-3' : 'w-3.5 h-3.5'} aria-hidden /> Maps
            </button>
            <button
              type="button"
              onClick={() => open3DView(usableCoords.lat, usableCoords.lng, poi.name, poi.address)}
              className={neutralBtnClass}
              title="Vista 3D"
              aria-label="Vista 3D"
            >
              <Box className={compact ? 'h-3 w-3' : 'w-3.5 h-3.5'} aria-hidden /> 3D
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={handleThumbClick}
          className={`${actionBtnClass} ${isVoted ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'}`}
          title="Vota"
          aria-label="Vota"
        >
          {isVoting ? (
            <Loader2
              className={compact ? 'h-3 w-3 animate-spin' : 'w-3.5 h-3.5 animate-spin'}
              aria-hidden
            />
          ) : (
            <ThumbsUp
              className={`${compact ? 'h-3 w-3' : 'w-3.5 h-3.5'} ${isVoted ? 'fill-current' : ''}`}
              aria-hidden
            />
          )}{' '}
          {localVotes}
        </button>
      </>
    );
  };

  return (
    <div
      className="td-modal-overlay bg-black/90 backdrop-blur-sm animate-in fade-in"
      style={{ zIndex: Z_OVERLAY }}
      role="presentation"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
        onClick={onClose}
      />
      <div
        className="relative bg-[#020617] w-full max-w-5xl h-full md:max-h-[95vh] md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 pointer-events-auto"
        style={{ zIndex: Z_MODAL }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="poi-detail-title"
      >
        <div className="relative shrink-0 border-b border-slate-800 bg-[#0f172a] p-4 md:p-6">
          <CloseButton onClose={onClose} position="absolute" variant="primary" />
          <div className="mt-4 flex flex-col gap-3 max-lg:gap-2 md:mt-6">
            <div className="flex w-full min-w-0 flex-col justify-end gap-1">
              <div className="flex min-w-0 w-full items-start gap-3 max-lg:pr-11 lg:items-center lg:pr-0">
                <h2
                  id="poi-detail-title"
                  className="min-w-0 flex-1 truncate text-xl font-display font-bold leading-tight text-white drop-shadow-md md:text-3xl"
                >
                  {poi.name}
                </h2>
                <div
                  role="img"
                  className={`flex shrink-0 items-center justify-center rounded-xl border px-2.5 py-1 lg:px-3 ${interestColor}`}
                  aria-label={`Interesse turistico: ${interestLabel}`}
                >
                  <div className="flex items-center gap-1 text-[10px] font-black leading-none lg:gap-1.5 lg:text-xs">
                    <TrendingUp className="h-3 w-3" aria-hidden />
                    {interestLabel}
                  </div>
                </div>
              </div>
              {poi.address ? (
                <div className="mb-1 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span className="truncate text-xs text-slate-400 md:text-sm">{poi.address}</span>
                </div>
              ) : (
                <div className="mb-1 h-5" aria-hidden="true" />
              )}
              {distance != null && (
                <span
                  className={`mb-1 inline-flex w-fit items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-900/30 px-2 py-1 whitespace-nowrap lg:hidden ${distanceBadgeStyle || 'text-[10px] font-black text-emerald-400'}`}
                >
                  <Navigation className="h-3 w-3 rotate-45 fill-current" /> {distance}km
                </span>
              )}
              <div className="flex min-w-0 w-full items-center gap-2 overflow-hidden border-t border-slate-800/50 pt-1 max-lg:justify-between max-lg:gap-4 lg:justify-between lg:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                  <span
                    className={`${poiDetailCategoryBadgeClass} flex min-h-9 items-center lg:min-h-0`}
                    title={subCategoryLabel}
                  >
                    {subCategoryLabel}
                  </span>
                  {distance != null && (
                    <span
                      className={`hidden shrink-0 items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-900/30 px-2 py-1 whitespace-nowrap lg:inline-flex ${distanceBadgeStyle || 'text-[10px] font-black text-emerald-400'}`}
                    >
                      <Navigation className="h-3 w-3 rotate-45 fill-current" /> {distance}km
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5 lg:gap-2">
                  {renderHeaderUtilityActions(true, isMobile)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <div className="relative min-h-0 w-full shrink-0 overflow-hidden border-b border-slate-800 bg-black h-[35vh] md:h-auto md:min-h-0 md:flex-1 md:flex-[1.2] lg:flex-[1.2]">
            <GallerySection
              poi={poi}
              isFlipped={isFlipped}
              setIsFlipped={setIsFlipped}
              onToggleItinerary={onToggleItinerary}
              isInItinerary={isInItinerary}
              user={user}
              onOpenAuth={onOpenAuth}
              onOpenReview={onOpenReview}
            />
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden bg-slate-900 lg:flex-none lg:shrink-0 lg:overflow-visible">
            <TextSection poi={poi} onSuggestEdit={onSuggestEdit} />
          </div>
        </div>
      </div>
    </div>
  );
};
