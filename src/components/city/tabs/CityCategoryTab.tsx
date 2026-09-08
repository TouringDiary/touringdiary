import {
  ArrowDown,
  ArrowDownAZ,
  ArrowUp,
  Coins,
  Crosshair,
  Heart,
  type LucideIcon,
  PenTool,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useItinerary } from '@/context/ItineraryContext';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';
import { listUserFavorites } from '@/services/myspace/userFavoritesService';
import { useInteraction } from '../../../context/InteractionContext';
import { useDynamicStyles } from '../../../hooks/useDynamicStyles';
import { calculateDistance } from '../../../services/geo';
import type { PointOfInterest, SuggestionType, User as UserType } from '../../../types/index';
import { getPoiCategoryLabel } from '../../../utils/common';
import { AdPlaceholder } from '../../common/AdPlaceholder';
import { AnchoredPopover } from '../../common/AnchoredPopover';
import { SmartFilterDrawer } from '../../common/SmartFilterDrawer';
import { CompactDiscoveryCard } from '../ShowcaseCards';
import { CategorySponsorColumn } from './CategorySponsorColumn';
import { CityGuide } from './CityGuide';

// --- MAPPING CATEGORIA -> TAB ---
const CATEGORY_TO_TAB_MAP: Record<string, string> = {
  monument: 'destinazioni',
  food: 'sapori',
  hotel: 'alloggi',
  nature: 'natura',
  leisure: 'svago',
  shop: 'shopping',
  discovery: 'novita',
};

/** Chip toolbar City — tipografia, altezza e allineamento condivisi (Contribuisci / Ordina / Filtri idle). */
const CITY_TOOLBAR_CHIP =
  'h-11 shrink-0 px-4 rounded-xl border border-slate-700 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider leading-none flex items-center justify-center gap-2 shadow-sm transition-all hover:bg-slate-800 hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50';
const CITY_TOOLBAR_CHIP_ICON = 'w-3.5 h-3.5 shrink-0 block';

/** Coordinate usabili per distance sort: finite; solo (0,0) è placeholder. */
function hasUsableCoords(
  coords: { lat: number; lng: number } | null | undefined,
): coords is { lat: number; lng: number } {
  if (!coords) return false;
  if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return false;
  if (coords.lat === 0 && coords.lng === 0) return false;
  return true;
}

// --- COMPONENTE SEARCH ESTRATTO ---
const SearchInput = ({
  value,
  onChange,
  placeholder = 'Cerca luogo...',
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) => {
  return (
    <div className="relative group flex items-center bg-[#0f172a] border border-slate-800 rounded-xl shadow-inner transition-all hover:border-slate-600 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 h-11 w-full min-w-0 md:max-w-sm">
      <div className="pl-3 pr-2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 font-medium h-full rounded-r-xl pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 text-slate-500 hover:text-white transition-colors p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

interface CityCategoryTabProps {
  sourceList: PointOfInterest[];
  activeSponsors: PointOfInterest[];
  userLocation: { lat: number; lng: number } | null;
  onToggleLocation: () => void;
  onAddToItinerary: (poi: PointOfInterest) => void;
  onOpenPoiDetail: (poi: PointOfInterest) => void;
  onOpenReview: (poi: PointOfInterest) => void;
  onOpenSponsor: (tier?: 'gold' | 'silver') => void;
  referencePoint: PointOfInterest | null;
  setReferencePoint: (poi: PointOfInterest | null) => void;
  onOpenSuggestion: (type: SuggestionType) => void;
  isSidebarOpen?: boolean;
  onOpenShopFromPoi: (poi: PointOfInterest) => void;
  user: UserType;
  onOpenAuth: () => void;
  isUiVisible?: boolean;
  onAdminEdit?: (poi: PointOfInterest) => void;
  onTabChange?: (tab: string) => void;
  currentCategory?: string;
}

type SortOption = 'votes' | 'rating' | 'name' | 'interest' | 'price';
type SortDirection = 'asc' | 'desc';

function getInterestScore(interest?: string): number {
  switch (interest) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}

export const CityCategoryTab = ({
  sourceList,
  activeSponsors,
  userLocation,
  onToggleLocation,
  onAddToItinerary,
  onOpenPoiDetail,
  onOpenReview,
  onOpenSponsor,
  referencePoint,
  setReferencePoint,
  onOpenSuggestion,
  isSidebarOpen,
  onOpenShopFromPoi,
  user,
  onOpenAuth,
  isUiVisible,
  onAdminEdit,
  onTabChange,
  currentCategory = 'all',
}: CityCategoryTabProps) => {
  const { itinerary } = useItinerary();
  const { hasUserLiked, toggleLike } = useInteraction();
  const isMobile = useMobileDetect();

  // Filters - DEFAULT SORT CHANGED TO 'interest'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('interest');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<{
    status:
      | 'published'
      | 'draft'
      | 'needs_check'
      | 'all'
      | 'new'
      | 'ready'
      | 'imported'
      | 'discarded';
    category: string;
    subCategory: string[];
    minRating: number;
    interest: string;
    priceLevel: number[];
    favoritesOnly: boolean;
  }>({
    status: 'all',
    category: currentCategory,
    subCategory: [],
    minRating: 0,
    interest: 'all',
    priceLevel: [],
    favoritesOnly: false,
  });

  /** ID POI nei preferiti dell'utente — stessa pipeline di Ordina/Filtri. */
  const [favoritePoiIds, setFavoritePoiIds] = useState<Set<string>>(() => new Set());

  // Filtriamo gli sponsor per Tier
  const goldSponsors = useMemo(
    () => activeSponsors.filter((s) => s.tier === 'gold'),
    [activeSponsors],
  );
  const silverSponsors = useMemo(
    () => activeSponsors.filter((s) => s.tier === 'silver'),
    [activeSponsors],
  );

  // Reset filters when tab changes
  useEffect(() => {
    setAdvancedFilters((prev) => ({
      ...prev,
      category: currentCategory,
      subCategory: [],
      minRating: 0,
      interest: 'all',
      priceLevel: [],
      // favoritesOnly resta attivo tra tab: stesso scope Preferiti sulla categoria corrente
    }));
    setSearchTerm('');
  }, [currentCategory]);

  // Carica ID preferiti POI (MySpace bookmark) per l'utente autenticato
  useEffect(() => {
    const userId = user?.role === 'guest' ? null : user?.id;
    if (!userId) {
      setFavoritePoiIds(new Set());
      setAdvancedFilters((prev) => (prev.favoritesOnly ? { ...prev, favoritesOnly: false } : prev));
      return;
    }
    let cancelled = false;
    void (async () => {
      const list = await listUserFavorites(userId);
      if (cancelled) return;
      setFavoritePoiIds(new Set(list.filter((f) => f.entityKind === 'poi').map((f) => f.entityId)));
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  // Dropdown States
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showContribMenu, setShowContribMenu] = useState(false);

  const referenceDistanceStyle = useDynamicStyles('city_reference_distance');
  const filterSectionLabel10Style = useDynamicStyles('filter_section_title', true);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  // Il menu "Contribuisci" è portalato (AnchoredPopover) per uscire dagli antenati
  // con overflow/isolate/z-0; l'ancora è il pulsante stesso.
  const contribBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isItemInItinerary = (id: string) => itinerary.items.some((i) => i.poi.id === id);

  const handleSetReference = (e: React.MouseEvent, poi: PointOfInterest) => {
    e.stopPropagation();
    if (referencePoint?.id === poi.id) {
      setReferencePoint(null);
    } else {
      setReferencePoint(poi);
    }
  };

  const handleLike = (poi: PointOfInterest) => {
    if (!user || user.role === 'guest') {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    toggleLike(poi.id);
  };

  const handleFavoriteChange = (poiId: string, isFavorite: boolean) => {
    setFavoritePoiIds((prev) => {
      const next = new Set(prev);
      if (isFavorite) next.add(poiId);
      else next.delete(poiId);
      return next;
    });
  };

  // Slot sponsor mobile: mostra la card se lo sponsor esiste, altrimenti il
  // placeholder "Partner" (stessa logica di CityShowcaseTab e delle colonne desktop),
  // così a fondo pagina è SEMPRE presente un box sponsor anche senza contratti attivi.
  const renderMobileSponsorSlot = (sponsor: PointOfInterest | null, tier: 'gold' | 'silver') => {
    if (sponsor) {
      return (
        <div className="h-40 w-full">
          <CompactDiscoveryCard
            poi={sponsor}
            onOpenDetail={onOpenPoiDetail}
            onAddToItinerary={onAddToItinerary}
            onLike={() => handleLike(sponsor)}
            isLiked={hasUserLiked(sponsor.id)}
            fluid={true}
            verticalStretch={true}
            userLocation={userLocation}
          />
        </div>
      );
    }
    return (
      <div className="h-40 w-full">
        <AdPlaceholder
          variant={tier}
          label={`Partner ${tier === 'gold' ? 'Gold' : 'Silver'}`}
          className="h-full w-full"
          onClick={() => onOpenSponsor(tier)}
        />
      </div>
    );
  };

  const handleProtectedAction = (action: () => void) => {
    if (!user || user.role === 'guest') {
      onOpenAuth();
    } else {
      action();
    }
    setShowContribMenu(false);
  };

  const handleCategoryLinkClick = () => {
    if (!referencePoint || !onTabChange) return;
    const targetTab = CATEGORY_TO_TAB_MAP[referencePoint.category];
    if (targetTab) {
      onTabChange(targetTab);
    }
  };

  const activeFilterCount =
    advancedFilters.subCategory.length +
    (advancedFilters.minRating > 0 ? 1 : 0) +
    (advancedFilters.interest !== 'all' ? 1 : 0) +
    (advancedFilters.priceLevel.length > 0 ? 1 : 0) +
    (advancedFilters.favoritesOnly ? 1 : 0);

  // Placeholder contestuale alla tab corrente (es. "Cerca Destinazioni...").
  const searchPlaceholder =
    currentCategory && currentCategory !== 'all'
      ? `Cerca ${getPoiCategoryLabel(currentCategory)}...`
      : 'Cerca luogo...';

  const handleResetFilters = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdvancedFilters((prev) => ({
      ...prev,
      subCategory: [],
      minRating: 0,
      interest: 'all',
      priceLevel: [],
      favoritesOnly: false,
    }));
  };

  const handleSortChange = (key: SortOption) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir(key === 'name' || key === 'price' ? 'asc' : 'desc');
    }
  };

  // --- FILTER & SORT LOGIC ---
  // Preferiti = pre-filtro sullo stesso sourceList; Ordina/Filtri agiscono sul risultato.
  const filteredList = useMemo(() => {
    const result = sourceList.filter((poi) => {
      if (advancedFilters.favoritesOnly && !favoritePoiIds.has(poi.id)) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = (poi.name || '').toLowerCase().includes(term);
        const matchDesc = (poi.description || '').toLowerCase().includes(term);
        if (!matchName && !matchDesc) return false;
      }
      if (advancedFilters.minRating > 0 && (poi.rating || 0) < advancedFilters.minRating)
        return false;

      if (advancedFilters.subCategory.length > 0) {
        const poiSub = poi.subCategory ? poi.subCategory.toLowerCase().trim() : '_generic_';
        if (
          !advancedFilters.subCategory.some(
            (filterSub) => filterSub.toLowerCase().trim() === poiSub,
          )
        )
          return false;
      }

      if (advancedFilters.interest && advancedFilters.interest !== 'all') {
        if (advancedFilters.interest === 'unknown') {
          if (poi.tourismInterest !== null && poi.tourismInterest !== undefined) return false;
        } else {
          if (poi.tourismInterest !== advancedFilters.interest) return false;
        }
      }
      if (advancedFilters.priceLevel && advancedFilters.priceLevel.length > 0) {
        if (!poi.priceLevel || !advancedFilters.priceLevel.includes(poi.priceLevel)) return false;
      }
      return true;
    });

    if (hasUsableCoords(referencePoint?.coords)) {
      const refCoords = referencePoint.coords;
      return result.sort((a, b) => {
        const distA = hasUsableCoords(a.coords)
          ? calculateDistance(refCoords.lat, refCoords.lng, a.coords.lat, a.coords.lng)
          : Number.POSITIVE_INFINITY;
        const distB = hasUsableCoords(b.coords)
          ? calculateDistance(refCoords.lat, refCoords.lng, b.coords.lat, b.coords.lng)
          : Number.POSITIVE_INFINITY;
        return distA - distB;
      });
    }

    return result.sort((a, b) => {
      const multiplier = sortDir === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'votes':
          return ((a.votes || 0) - (b.votes || 0)) * multiplier;
        case 'rating':
          return ((a.rating || 0) - (b.rating || 0)) * multiplier;
        case 'interest': {
          const scoreA = getInterestScore(a.tourismInterest);
          const scoreB = getInterestScore(b.tourismInterest);
          return scoreA !== scoreB
            ? (scoreA - scoreB) * multiplier
            : ((a.rating || 0) - (b.rating || 0)) * multiplier;
        }
        case 'price':
          return ((a.priceLevel || 0) - (b.priceLevel || 0)) * multiplier;
        case 'name':
          return (a.name || '').localeCompare(b.name || '') * multiplier;
        default:
          return 0;
      }
    });
  }, [sourceList, searchTerm, sortBy, sortDir, advancedFilters, referencePoint, favoritePoiIds]);

  const SortItem = ({
    id,
    label,
    icon: Icon,
  }: {
    id: SortOption;
    label: string;
    icon: LucideIcon;
  }) => {
    const isActive = sortBy === id;
    return (
      <button
        type="button"
        onClick={() => handleSortChange(id)}
        className={`w-full text-left px-4 py-3 text-xs font-bold uppercase flex items-center justify-between gap-2 hover:bg-slate-800 transition-colors ${isActive ? 'text-amber-500 bg-slate-800/50' : 'text-slate-400'}`}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" /> {label}
        </div>
        {isActive && (
          <div className="flex items-center text-[10px] text-slate-400 font-black gap-2">
            <span className="text-slate-700">|</span>
            {sortDir === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5" />
            )}
          </div>
        )}
      </button>
    );
  };

  // --- RENDER COMPLETO ---
  return (
    <div className="flex flex-col w-full h-auto lg:h-full bg-[#020617] relative">
      <SmartFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={advancedFilters}
        onApply={(newFilters) => setAdvancedFilters((prev) => ({ ...prev, ...newFilters }))}
        resultCount={filteredList.length}
        availableItems={sourceList}
        hideStatus={true}
        hideCategory={true}
        enableFavoritesFilter={true}
        canUseFavorites={Boolean(user && user.role !== 'guest')}
        onRequireAuthForFavorites={() => {
          setIsFilterDrawerOpen(false);
          onOpenAuth();
        }}
      />

      {/* HEADER CONTROLLI (2 RIGHE) - RELATIVE SU MOBILE PER SCROLLARE VIA */}
      <div
        className={`
                flex flex-col border-b border-slate-800 bg-[#020617]/95 backdrop-blur-md z-local-sticky transition-all duration-300 shadow-xl shrink-0
                relative lg:sticky lg:top-0
                ${isUiVisible === false && !isMobile ? '-translate-y-full opacity-0 pointer-events-none absolute w-full' : ''}
            `}
      >
        <div className="flex flex-col gap-2 p-3">
          {/* TOOLBAR — mobile: singola riga; md+: layout a tre zone */}
          <div className="flex flex-row gap-2 items-center justify-between w-full md:items-center">
            {/* LEFT: CONTRIBUISCI */}
            <div className="relative shrink-0 md:w-1/4">
              <button
                type="button"
                ref={contribBtnRef}
                onClick={() => setShowContribMenu(!showContribMenu)}
                className={`${CITY_TOOLBAR_CHIP} max-md:w-11 max-md:px-0 w-auto whitespace-nowrap md:w-auto`}
                aria-label="Contribuisci"
              >
                <Plus className={CITY_TOOLBAR_CHIP_ICON} aria-hidden />
                <span className="hidden md:inline">Contribuisci</span>
              </button>
              <AnchoredPopover
                isOpen={showContribMenu}
                onClose={() => setShowContribMenu(false)}
                anchorRef={contribBtnRef}
                align="left"
                role="menu"
                className="w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden py-1 origin-top-left"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowContribMenu(false);
                    handleProtectedAction(() => onOpenSuggestion('new_place'));
                  }}
                  className="w-full text-left px-4 py-3 text-xs font-bold uppercase flex items-center gap-3 hover:bg-slate-800 text-emerald-400 transition-colors border-b border-slate-800/50"
                >
                  <Plus className="w-3.5 h-3.5" /> Nuovo Luogo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowContribMenu(false);
                    handleProtectedAction(() => onOpenSuggestion('edit_info'));
                  }}
                  className="w-full text-left px-4 py-3 text-xs font-bold uppercase flex items-center gap-3 hover:bg-slate-800 text-indigo-400 transition-colors"
                >
                  <PenTool className="w-3.5 h-3.5" /> Modifica Luogo
                </button>
              </AnchoredPopover>
            </div>

            {/* CENTER: SEARCH */}
            <div className="flex-1 min-w-0 md:px-4 flex justify-center">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={searchPlaceholder}
              />
            </div>

            {/* RIGHT: TOOLS (SORT & FILTER) */}
            <div className="flex gap-2 shrink-0 md:w-1/4 justify-end">
              {/* SORT */}
              <div className="relative shrink-0" ref={sortMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className={`${CITY_TOOLBAR_CHIP} w-auto`}
                >
                  <ArrowDownAZ className={CITY_TOOLBAR_CHIP_ICON} aria-hidden />
                  <span className="hidden md:inline">Ordina</span>
                </button>
                {showSortMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 z-local-flyout bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden py-1 animate-in zoom-in-95 origin-top-right">
                    <div
                      className={`px-3 py-2 ${filterSectionLabel10Style} border-b border-slate-800 mb-1`}
                    >
                      Ordina Per
                    </div>
                    <SortItem id="votes" label="Popolarità" icon={Heart} />
                    <SortItem id="interest" label="Interesse" icon={TrendingUp} />
                    <SortItem id="rating" label="Valutazione" icon={Star} />
                    <SortItem id="price" label="Prezzo" icon={Coins} />
                    <SortItem id="name" label="A-Z" icon={ArrowDownAZ} />
                  </div>
                )}
              </div>

              {/* FILTERS — stesso chip di Ordina/Contribuisci; reset come sibling se attivi */}
              {activeFilterCount > 0 ? (
                <div className="shrink-0 h-11 flex items-center rounded-xl border border-indigo-500 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider leading-none overflow-hidden shadow-md">
                  <button
                    type="button"
                    onClick={() => setIsFilterDrawerOpen(true)}
                    className="h-full px-4 flex items-center justify-center gap-2 transition-all hover:bg-indigo-500/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-inset"
                  >
                    <SlidersHorizontal className={CITY_TOOLBAR_CHIP_ICON} aria-hidden />
                    <span className="hidden md:inline">Filtri</span>
                    <span aria-hidden>({activeFilterCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    aria-label="Azzera filtri"
                    className="h-full min-w-[44px] px-2 flex items-center justify-center border-l border-white/20 hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-inset"
                  >
                    <X className="w-3 h-3" aria-hidden />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className={`${CITY_TOOLBAR_CHIP} w-auto`}
                >
                  <SlidersHorizontal className={CITY_TOOLBAR_CHIP_ICON} aria-hidden />
                  <span className="hidden md:inline">Filtri</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGA 2: REFERENCE POINT (Se attivo) */}
        {referencePoint && (
          <div className="w-full px-4 pb-2 animate-in slide-in-from-top-1 bg-[#020617] border-b border-slate-800/50">
            <div className="bg-indigo-600/90 px-4 py-2 rounded-xl shadow-lg flex items-center justify-between border border-indigo-500/50 backdrop-blur-sm gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <Crosshair className="w-4 h-4 animate-pulse text-indigo-200 shrink-0" />
                <span
                  className={`truncate ${referenceDistanceStyle || 'text-white text-xs font-bold'}`}
                >
                  Distanza da:{' '}
                  <span className="font-bold text-indigo-300 ml-1">{referencePoint.name}</span>{' '}
                  <span className="text-indigo-200/70 text-[10px] ml-1">
                    (
                    <button
                      type="button"
                      onClick={handleCategoryLinkClick}
                      className="underline decoration-indigo-300/50 hover:text-indigo-200 transition-colors"
                    >
                      {getPoiCategoryLabel(referencePoint.category)}
                    </button>
                    )
                  </span>
                </span>
              </div>
              <CloseButton
                onClose={() => setReferencePoint(null)}
                variant="primary"
                className="text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* --- GRID LAYOUT RESPONSIVO (Contenuto Principale) --- */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[19rem_1fr_19rem] 2xl:grid-cols-[19rem_19rem_1fr_19rem_19rem] w-full relative">
        {/* 1. COLONNA ESTERNA SX (SOLO >1536px) */}
        <div className="hidden 2xl:block h-full border-r border-slate-800/50 overflow-hidden">
          <CategorySponsorColumn
            side="left"
            offsetMultiplier={0}
            goldSponsors={goldSponsors}
            silverSponsors={silverSponsors}
            onAddToItinerary={onAddToItinerary}
            onOpenPoiDetail={onOpenPoiDetail}
            onOpenSponsor={onOpenSponsor}
            onLike={handleLike}
            hasUserLiked={hasUserLiked}
            userLocation={userLocation}
          />
        </div>

        {/* 2. COLONNA INTERNA SX (Desktop Standard & Wide) */}
        <div className="hidden lg:block h-full border-r border-slate-800/50 overflow-hidden">
          <CategorySponsorColumn
            side="left"
            offsetMultiplier={1}
            goldSponsors={goldSponsors}
            silverSponsors={silverSponsors}
            onAddToItinerary={onAddToItinerary}
            onOpenPoiDetail={onOpenPoiDetail}
            onOpenSponsor={onOpenSponsor}
            onLike={handleLike}
            hasUserLiked={hasUserLiked}
            userLocation={userLocation}
          />
        </div>

        {/* 3. CONTENUTO CENTRALE (Fluido & Scrollable) */}
        <div className="w-full min-w-0 h-auto lg:h-full overflow-visible lg:overflow-y-auto custom-scrollbar bg-[#020617]">
          <div className="w-full flex flex-col pb-32">
            {/* CITY GUIDE RENDERIZZA LA LISTA VERTICALE DEI POI */}
            <CityGuide
              pois={filteredList}
              sponsors={activeSponsors}
              userLocation={userLocation}
              onAddToItinerary={onAddToItinerary}
              isItemInItinerary={isItemInItinerary}
              referencePoint={
                hasUsableCoords(referencePoint?.coords)
                  ? {
                      lat: referencePoint.coords.lat,
                      lng: referencePoint.coords.lng,
                      name: referencePoint.name,
                    }
                  : null
              }
              onSetReference={handleSetReference}
              onOpenDetail={onOpenPoiDetail}
              onOpenShop={onOpenShopFromPoi}
              onOpenSponsor={onOpenSponsor}
              isSidebarOpen={isSidebarOpen}
              user={user}
              onOpenAuth={onOpenAuth}
              onOpenReview={onOpenReview}
              onAdminEdit={onAdminEdit}
              onFavoriteChange={handleFavoriteChange}
            />

            {/* MOBILE SPONSOR BLOCK (Only visible on small screens) */}
            <div className="lg:hidden mt-8 px-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px flex-1 bg-amber-600/40"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  PARTNER
                </span>
                <div className="h-px flex-1 bg-amber-600/40"></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {renderMobileSponsorSlot(goldSponsors[0] || null, 'gold')}
                {renderMobileSponsorSlot(goldSponsors[1] || null, 'gold')}
              </div>
              <div className="w-full">
                {renderMobileSponsorSlot(silverSponsors[0] || null, 'silver')}
              </div>
            </div>
          </div>
        </div>

        {/* 4. COLONNA INTERNA DX (Desktop Standard & Wide) */}
        <div className="hidden lg:block h-full border-l border-slate-800/50 overflow-hidden">
          <CategorySponsorColumn
            side="right"
            offsetMultiplier={2}
            goldSponsors={goldSponsors}
            silverSponsors={silverSponsors}
            onAddToItinerary={onAddToItinerary}
            onOpenPoiDetail={onOpenPoiDetail}
            onOpenSponsor={onOpenSponsor}
            onLike={handleLike}
            hasUserLiked={hasUserLiked}
            userLocation={userLocation}
          />
        </div>

        {/* 5. COLONNA ESTERNA DX (SOLO >1536px) */}
        <div className="hidden 2xl:block h-full border-l border-slate-800/50 overflow-hidden">
          <CategorySponsorColumn
            side="right"
            offsetMultiplier={3}
            goldSponsors={goldSponsors}
            silverSponsors={silverSponsors}
            onAddToItinerary={onAddToItinerary}
            onOpenPoiDetail={onOpenPoiDetail}
            onOpenSponsor={onOpenSponsor}
            onLike={handleLike}
            hasUserLiked={hasUserLiked}
            userLocation={userLocation}
          />
        </div>
      </div>
    </div>
  );
};
