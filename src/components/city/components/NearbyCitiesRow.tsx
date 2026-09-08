import { ChevronDown, Globe2, MapPin, MoreHorizontal, MoreVertical, Star } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { HeaderPopover, type HeaderPopoverHandle } from '@/components/ui/header/HeaderPopover';
import { GEO_CONFIG } from '@/constants/geoConfig';
import { LAYOUT } from '@/constants/layout';
import { Z_POPOVER } from '@/constants/zIndex';
import { calculateDistance } from '../../../services/geo';
import type { CitySummary } from '../../../types/index';
import { CompassExploreButton } from './CompassExploreButton';

const OVERFLOW_SLOT_WIDTH = 44; // Larghezza fissa per lo slot dei "..." (tablet+)
/** Margine subpixel contro flicker del visibleCount al resize (rounding getBoundingClientRect). */
const OVERFLOW_SAFETY_PX = 2;
/** Raggio massimo Nearby Cities (km) — SoT dominio: GEO_CONFIG.SEARCH_RADIUS_MAX (PO: 100 km). */
const NEARBY_CITIES_MAX_KM = GEO_CONFIG.SEARCH_RADIUS_MAX;
/** Breakpoint Tailwind `sm` (px) — stesso soglia usata per la larghezza del menu filtro. */
const FILTER_MENU_SM_MIN_PX = 640;
/**
 * Larghezza menu filtro in px (SoT unica per clamp e `style.width`).
 * Allineata a Tailwind w-44 / w-48 (11rem / 12rem @ 16px root).
 */
const FILTER_MENU_WIDTH_PX = { base: 176, sm: 192 } as const;
const FILTER_MENU_EDGE_PAD = 8;
/** Gap verticale tra trigger e menu portaled. */
const FILTER_MENU_TRIGGER_GAP = 8;
/** Stima altezza menu prima del mount: 3×min-h-11 (132) + bordo 2px + riserva subpixel. */
const FILTER_MENU_ESTIMATED_HEIGHT_PX = 136;

const resolveFilterMenuWidthPx = (): number =>
  typeof window !== 'undefined' && window.innerWidth >= FILTER_MENU_SM_MIN_PX
    ? FILTER_MENU_WIDTH_PX.sm
    : FILTER_MENU_WIDTH_PX.base;

/** Parsa una coordinata runtime: number finito o stringa numerica; rifiuta il resto. */
function parseCoord(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Coordinate usabili per distanza (policy locale Nearby + mapper):
 * finite dopo conversione sicura, in range geografico; (0,0) = placeholder.
 */
function resolveUsableCoords(
  coords: { lat?: unknown; lng?: unknown } | null | undefined,
): { lat: number; lng: number } | null {
  if (!coords) return null;
  const lat = parseCoord(coords.lat);
  const lng = parseCoord(coords.lng);
  if (lat === null || lng === null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

interface Props {
  currentCity: CitySummary;
  allCities: CitySummary[];
  onExploreAround: (cityId: string) => void;
  onSwitchCity?: (cityId: string) => void;
}

type FilterType = 'visitors' | 'zone' | 'region';

export const NearbyCitiesRow: React.FC<Props> = ({
  currentCity,
  allCities,
  onExploreAround,
  onSwitchCity,
}) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>('visitors');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileFilterButtonRef = useRef<HTMLButtonElement>(null);
  const desktopFilterButtonRef = useRef<HTMLButtonElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const [filterMenuPos, setFilterMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const getActiveFilterButton = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const isMobileLayout = window.innerWidth < LAYOUT.BREAKPOINTS.MD;
    return isMobileLayout ? mobileFilterButtonRef.current : desktopFilterButtonRef.current;
  }, []);

  /** Posizione menu filtro clampata ai bordi viewport (orizzontale + verticale). */
  const computeFilterMenuPos = useCallback((rect: DOMRect) => {
    const width = resolveFilterMenuWidthPx();
    const maxLeft = Math.max(
      FILTER_MENU_EDGE_PAD,
      window.innerWidth - width - FILTER_MENU_EDGE_PAD,
    );
    const left = Math.min(Math.max(rect.left, FILTER_MENU_EDGE_PAD), maxLeft);

    const measuredHeight = filterMenuRef.current?.getBoundingClientRect().height;
    const menuHeight =
      measuredHeight && measuredHeight > 0 ? measuredHeight : FILTER_MENU_ESTIMATED_HEIGHT_PX;

    const belowTop = rect.bottom + FILTER_MENU_TRIGGER_GAP;
    const fitsBelow = belowTop + menuHeight <= window.innerHeight - FILTER_MENU_EDGE_PAD;

    let top: number;
    if (fitsBelow) {
      top = belowTop;
    } else {
      top = rect.top - FILTER_MENU_TRIGGER_GAP - menuHeight;
    }

    const maxTop = Math.max(
      FILTER_MENU_EDGE_PAD,
      window.innerHeight - menuHeight - FILTER_MENU_EDGE_PAD,
    );
    top = Math.min(Math.max(top, FILTER_MENU_EDGE_PAD), maxTop);

    return { top, left, width };
  }, []);

  const updateFilterMenuPos = useCallback(() => {
    const button = getActiveFilterButton();
    if (!button) return;
    setFilterMenuPos(computeFilterMenuPos(button.getBoundingClientRect()));
  }, [getActiveFilterButton, computeFilterMenuPos]);

  const openFilterMenu = useCallback(() => {
    const button = getActiveFilterButton();
    if (!button) return;
    setFilterMenuPos(computeFilterMenuPos(button.getBoundingClientRect()));
    setIsFilterOpen(true);
  }, [getActiveFilterButton, computeFilterMenuPos]);

  const closeFilterMenu = useCallback(() => {
    setIsFilterOpen(false);
    setFilterMenuPos(null);
  }, []);

  // Chiudi dropdown al click esterno (trigger + menu portaled)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        mobileDropdownRef.current?.contains(target) ||
        desktopDropdownRef.current?.contains(target) ||
        filterMenuRef.current?.contains(target)
      ) {
        return;
      }
      closeFilterMenu();
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [closeFilterMenu]);

  useEffect(() => {
    if (!isFilterOpen) return;
    updateFilterMenuPos();
    window.addEventListener('resize', updateFilterMenuPos);
    window.addEventListener('scroll', updateFilterMenuPos, true);
    return () => {
      window.removeEventListener('resize', updateFilterMenuPos);
      window.removeEventListener('scroll', updateFilterMenuPos, true);
    };
  }, [isFilterOpen, updateFilterMenuPos]);

  const filterOptions = [
    { id: 'visitors', label: 'Meta turistica', icon: Star },
    { id: 'zone', label: 'Zona turistica', icon: MapPin },
    { id: 'region', label: 'Area regionale', icon: Globe2 },
  ] as const satisfies ReadonlyArray<{ id: FilterType; label: string; icon: typeof Star }>;

  const currentFilter = filterOptions.find((f) => f.id === activeFilter) || filterOptions[0];

  // LOGICA OVERFLOW DETERMINISTICA (tablet+)
  const containerRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const popoverRef = useRef<HeaderPopoverHandle>(null);
  const mobilePopoverRef = useRef<HeaderPopoverHandle>(null);

  const nearby = useMemo(() => {
    const origin = resolveUsableCoords(currentCity.coords);
    if (!origin) return [];

    const withDistance: Array<CitySummary & { distance: number }> = [];
    for (const city of allCities) {
      if (city.id === currentCity.id) continue;
      const point = resolveUsableCoords(city.coords);
      if (!point) continue;
      withDistance.push({
        ...city,
        distance: calculateDistance(origin.lat, origin.lng, point.lat, point.lng),
      });
    }

    let selection: typeof withDistance = [];

    if (activeFilter === 'visitors') {
      selection = withDistance
        .filter((c) => c.distance > 0 && c.distance <= NEARBY_CITIES_MAX_KM)
        .sort((a, b) => (b.visitors || 0) - (a.visitors || 0));
    } else if (activeFilter === 'zone') {
      selection = withDistance
        .filter((c) => c.zone_slug === currentCity.zone_slug && c.distance <= NEARBY_CITIES_MAX_KM)
        .sort((a, b) => a.distance - b.distance);
    } else if (activeFilter === 'region') {
      selection = withDistance
        .filter(
          (c) => c.region_slug === currentCity.region_slug && c.distance <= NEARBY_CITIES_MAX_KM,
        )
        .sort((a, b) => a.distance - b.distance);
    }

    // Fill fino a 4 solo entro lo stesso raggio Nearby (mai oltre NEARBY_CITIES_MAX_KM).
    if (selection.length < 4) {
      const remaining = withDistance
        .filter(
          (c) =>
            c.distance > 0 &&
            c.distance <= NEARBY_CITIES_MAX_KM &&
            !selection.some((s) => s.id === c.id),
        )
        .sort((a, b) => {
          const aSameZone = a.zone_slug === currentCity.zone_slug ? 1 : 0;
          const bSameZone = b.zone_slug === currentCity.zone_slug ? 1 : 0;
          if (aSameZone !== bSameZone) return bSameZone - aSameZone;

          const aSameRegion = a.region_slug === currentCity.region_slug ? 1 : 0;
          const bSameRegion = b.region_slug === currentCity.region_slug ? 1 : 0;
          if (aSameRegion !== bSameRegion) return bSameRegion - aSameRegion;

          return a.distance - b.distance;
        });
      selection = [...selection, ...remaining];
    }

    return selection.slice(0, 4);
  }, [currentCity, allCities, activeFilter]);

  // FUNZIONE DI MISURAZIONE DETERMINISTICA (ghost geometricamente allineato al rendering reale)
  const calculateOverflow = useCallback(() => {
    if (!containerRef.current || !ghostRef.current || nearby.length === 0) return;

    const containerWidth = Math.floor(containerRef.current.getBoundingClientRect().width);
    const measureRow = ghostRef.current.querySelector('.ghost-measure-row');
    const ghostLabel = ghostRef.current.querySelector('.ghost-label');
    const ghostCities = ghostRef.current.querySelector('.ghost-cities');
    if (!(measureRow instanceof HTMLElement) || !(ghostCities instanceof HTMLElement)) return;

    const totalNeeded = Math.ceil(measureRow.getBoundingClientRect().width);
    if (totalNeeded <= containerWidth - OVERFLOW_SAFETY_PX) {
      setVisibleCount(nearby.length);
      return;
    }

    // Non entra tutto: i "..." (slot esterno) sono obbligatori — lascia almeno 1 città nascosta.
    const labelWidth =
      ghostLabel instanceof HTMLElement ? Math.ceil(ghostLabel.getBoundingClientRect().width) : 0;
    const outerGap = Number.parseFloat(getComputedStyle(measureRow).columnGap || '0') || 0;
    const citiesGap = Number.parseFloat(getComputedStyle(ghostCities).columnGap || '0') || 0;
    const kids = Array.from(ghostCities.children).filter(
      (node): node is HTMLElement => node instanceof HTMLElement,
    );

    let used = labelWidth + outerGap;
    let count = 0;

    for (let i = 0; i < kids.length; i++) {
      const childWidth = Math.ceil(kids[i].getBoundingClientRect().width);
      const gapBefore = i === 0 ? 0 : citiesGap;
      if (used + gapBefore + childWidth > containerWidth - OVERFLOW_SAFETY_PX) break;
      used += gapBefore + childWidth;
      if (kids[i].classList.contains('ghost-city-item')) count += 1;
    }

    setVisibleCount(Math.min(count, nearby.length - 1));
  }, [nearby]);

  useEffect(() => {
    const observer = new ResizeObserver(calculateOverflow);
    if (containerRef.current) observer.observe(containerRef.current);
    calculateOverflow();
    return () => observer.disconnect();
  }, [calculateOverflow]);

  const handleCityClick = (e: React.MouseEvent, cityId: string) => {
    if (onSwitchCity) {
      e.preventDefault();
      onSwitchCity(cityId);
    }
  };

  const handlePopoverCityClick = (
    e: React.MouseEvent,
    cityId: string,
    path: string,
    popoverHandle?: HeaderPopoverHandle | null,
  ) => {
    e.preventDefault();
    popoverHandle?.close();
    if (onSwitchCity) {
      onSwitchCity(cityId);
    } else {
      setTimeout(() => navigate(path), 10);
    }
  };

  if (nearby.length === 0) return null;

  const visibleCities = nearby.slice(0, visibleCount);
  const hiddenCities = nearby.slice(visibleCount);
  const mobilePopoverCities = nearby;

  const renderPopoverCityList = (
    cities: typeof nearby,
    popoverHandle: React.RefObject<HeaderPopoverHandle | null>,
  ) => (
    <div className="flex flex-col gap-1.5">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1.5 px-1 border-b border-slate-800/50 pb-1.5">
        Altre destinazioni
      </p>
      {cities.map((city) => {
        const segments = [
          city.continent_slug,
          city.nation_slug,
          city.region_slug,
          city.zone_slug,
          city.slug,
        ].filter(Boolean);
        const path = `/${segments.join('/')}`;
        return (
          <button
            type="button"
            key={city.id || city.slug}
            onClick={(e) => handlePopoverCityClick(e, city.id, path, popoverHandle.current)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-800/80 text-slate-300 hover:text-white transition-all group text-left"
          >
            <span className="text-[11px] font-bold">{city.name}</span>
            <span className="text-[9px] font-mono opacity-40 group-hover:opacity-100 transition-opacity">
              {Math.round(city.distance)}km
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderFilterMenu = () => {
    if (!isFilterOpen || !filterMenuPos) return null;
    return createPortal(
      <div
        ref={filterMenuRef}
        className="fixed bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        style={{
          top: filterMenuPos.top,
          left: filterMenuPos.left,
          width: filterMenuPos.width,
          zIndex: Z_POPOVER,
        }}
      >
        {filterOptions.map((f) => (
          <button
            type="button"
            key={f.id}
            onClick={() => {
              setActiveFilter(f.id);
              closeFilterMenu();
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 min-h-11 text-left transition-colors hover:bg-slate-800 ${activeFilter === f.id ? 'bg-amber-500/10 text-amber-500' : 'text-slate-400'}`}
          >
            <f.icon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">{f.label}</span>
          </button>
        ))}
      </div>,
      document.body,
    );
  };

  const renderFilterTrigger = (
    variant: 'mobile' | 'desktop',
    buttonRef: React.RefObject<HTMLButtonElement | null>,
  ) => {
    const TriggerIcon = currentFilter.icon;
    return (
      <button
        type="button"
        ref={buttonRef}
        onClick={() => {
          if (isFilterOpen) {
            closeFilterMenu();
          } else {
            openFilterMenu();
          }
        }}
        aria-expanded={isFilterOpen}
        aria-haspopup="true"
        aria-label={variant === 'mobile' ? `Filtra per: ${currentFilter.label}` : undefined}
        className={`flex items-center justify-center bg-slate-900/90 rounded-lg border border-slate-800 shadow-inner hover:border-slate-700 transition-all group active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 min-h-11 ${
          variant === 'mobile' ? 'gap-1.5 px-2.5 py-1.5 shrink-0' : 'gap-1.5 sm:gap-2 px-2.5 py-1.5'
        }`}
      >
        {variant === 'mobile' ? (
          <TriggerIcon className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform shrink-0 block" />
        ) : (
          <>
            <TriggerIcon className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform shrink-0 block" />
            <span className="text-[10px] font-bold uppercase tracking-wider leading-none text-white whitespace-nowrap">
              {currentFilter.label}
            </span>
          </>
        )}
        <ChevronDown
          className={`w-3 h-3 text-slate-500 transition-transform shrink-0 block ${isFilterOpen ? 'rotate-180' : ''}`}
        />
      </button>
    );
  };

  return (
    <div className="w-full bg-slate-950/60 border-b border-slate-800/40 py-2 sm:py-2.5 relative z-local-raised select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.6)_0%,transparent_100%)] pointer-events-none" />

      {/* 
        LAYOUT DETERMINISTICO 3 COLONNE 
        - Col 1 & 3 sono 1fr per centrare Col 2
      */}
      <div className="relative max-w-[1400px] mx-auto px-4">
        {/* MOBILE — SELEZIONA | VICINO A {città} ⋮ | Dintorni */}
        <div className="flex md:hidden items-center gap-2 w-full min-w-0">
          <div className="relative shrink-0" ref={mobileDropdownRef}>
            {renderFilterTrigger('mobile', mobileFilterButtonRef)}
          </div>

          <div className="flex-1 min-w-0 flex items-center gap-1 px-1">
            <p className="truncate text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 min-w-0 flex-1">
              Vicino a <span className="text-slate-200">{currentCity.name}</span>
            </p>

            {mobilePopoverCities.length > 0 && (
              <HeaderPopover
                ref={mobilePopoverRef}
                width="220px"
                alignment="right"
                className="bg-slate-900/98 border border-slate-800 rounded-xl p-3 shadow-2xl ring-1 ring-slate-800/50"
                triggerAriaLabel="Mostra altre destinazioni"
                trigger={
                  <span className="p-0.5 min-h-11 min-w-11 text-slate-500 hover:text-amber-400 transition-colors flex items-center justify-center active:scale-90 leading-none shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </span>
                }
              >
                {renderPopoverCityList(mobilePopoverCities, mobilePopoverRef)}
              </HeaderPopover>
            )}
          </div>

          <CompassExploreButton
            onClick={(e) => {
              e.preventDefault();
              onExploreAround(currentCity.id);
            }}
          />
        </div>

        {/* TABLET+ — layout a tre colonne */}
        <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] items-center">
          {/* [SINISTRA - ALLINEATA A SX] */}
          <div className="flex items-center gap-2 sm:gap-4 justify-start">
            <div className="relative" ref={desktopDropdownRef}>
              {renderFilterTrigger('desktop', desktopFilterButtonRef)}
            </div>
            <div className="w-px h-4 bg-slate-800/80 shrink-0 hidden xs:block" />
          </div>

          {/* [CENTRO - DINAMICO CENTRATO] */}
          <div
            ref={containerRef}
            className="flex justify-center items-center px-4 overflow-hidden relative"
          >
            {/* GHOST: stesso albero geometrico del rendering reale (label + chip + `|` + gap). */}
            <div
              ref={ghostRef}
              className="absolute invisible opacity-0 pointer-events-none whitespace-nowrap left-0 top-0"
              aria-hidden
            >
              <div className="ghost-measure-row flex items-center gap-2 sm:gap-3">
                <span className="ghost-label text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap shrink-0">
                  Vicino a <span className="text-slate-300">{currentCity.name}</span>:
                </span>
                <div className="ghost-cities flex items-center gap-2">
                  {nearby.map((city, idx) => (
                    <React.Fragment key={city.id || city.slug}>
                      <div className="ghost-city-item px-2.5 sm:px-3 py-1.5 bg-slate-900/40 border border-slate-800 rounded-xl text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <span>{city.name}</span>
                        <span className="text-[8px] opacity-30 font-mono font-normal shrink-0">
                          {Math.round(city.distance)}km
                        </span>
                      </div>
                      {idx < nearby.length - 1 && (
                        <span className="ghost-sep text-slate-800/60 font-light text-[10px] shrink-0">
                          |
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* RENDERING REALE SEMANTICO */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden whitespace-nowrap">
              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap shrink-0">
                Vicino a <span className="text-slate-300">{currentCity.name}</span>:
              </span>

              <div className="flex items-center gap-2 overflow-hidden">
                {visibleCities.map((city, idx) => {
                  const segments = [
                    city.continent_slug,
                    city.nation_slug,
                    city.region_slug,
                    city.zone_slug,
                    city.slug,
                  ].filter(Boolean);
                  const path = `/${segments.join('/')}`;

                  return (
                    <React.Fragment key={city.id || city.slug}>
                      <Link
                        to={path}
                        onClick={(e) => handleCityClick(e, city.id)}
                        className="px-2.5 sm:px-3 py-1.5 bg-slate-900/40 border border-slate-800 rounded-xl text-[10px] sm:text-[11px] font-bold text-slate-400 hover:text-white hover:border-amber-500/40 hover:bg-slate-900 transition-all shadow-sm flex items-center gap-1.5 sm:gap-2 group/city focus-visible:ring-1 focus-visible:ring-amber-500 outline-none"
                      >
                        <span className="group-hover:text-amber-400 transition-colors">
                          {city.name}
                        </span>
                        <span className="text-[8px] opacity-30 font-mono font-normal shrink-0">
                          {Math.round(city.distance)}km
                        </span>
                      </Link>
                      {idx < visibleCities.length - 1 && (
                        <span className="text-slate-800/60 font-light text-[10px] shrink-0">|</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* [DESTRA - ALLINEATA A DX CON SLOT FISSO] */}
          <div className="flex items-center gap-2 sm:gap-4 justify-end">
            {/* SLOT FISSO OVERFLOW DETERMINISTICO */}
            <div
              className="flex items-center justify-center shrink-0 transition-opacity duration-200"
              style={{ width: `${OVERFLOW_SLOT_WIDTH}px` }}
            >
              {hiddenCities.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-800/60 font-light text-[10px] shrink-0">|</span>
                  <HeaderPopover
                    ref={popoverRef}
                    width="220px"
                    alignment="right"
                    className="bg-slate-900/98 border border-slate-800 rounded-xl p-3 shadow-2xl ring-1 ring-slate-800/50"
                    triggerAriaLabel="Mostra altre destinazioni"
                    trigger={
                      <span className="p-1.5 min-h-11 min-w-11 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-500 hover:text-amber-400 hover:border-amber-500/40 transition-all flex items-center justify-center active:scale-90">
                        <MoreHorizontal className="w-4 h-4" />
                      </span>
                    }
                  >
                    {renderPopoverCityList(hiddenCities, popoverRef)}
                  </HeaderPopover>
                </div>
              ) : (
                // Spazio mantenuto ma invisibile per stabilità deterministica
                <div className="invisible" aria-hidden="true">
                  | ...
                </div>
              )}
            </div>

            <div className="w-px h-4 bg-slate-800/80 shrink-0 hidden xs:block" />
            <CompassExploreButton
              onClick={(e) => {
                e.preventDefault();
                onExploreAround(currentCity.id);
              }}
            />
          </div>
        </div>
      </div>

      {renderFilterMenu()}
    </div>
  );
};
