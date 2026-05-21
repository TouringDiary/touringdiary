import { Z_FLOATING_PANEL } from '@/constants/zIndex';
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { calculateDistance } from '../../../services/geo';
import { CitySummary } from '../../../types/index';
import { CompassExploreButton } from './CompassExploreButton';
import { MapPin, Star, Globe2, ChevronDown, MoreHorizontal } from 'lucide-react';
import { HeaderPopover, HeaderPopoverHandle } from '@/components/ui/header/HeaderPopover';

const OVERFLOW_SLOT_WIDTH = 44; // Larghezza fissa per lo slot dei "..."
const GAP_WIDTH = 8; // gap-2

interface Props {
  currentCity: CitySummary;
  allCities: CitySummary[];
  onExploreAround: (cityId: string) => void;
  onSwitchCity?: (cityId: string) => void;
}

type FilterType = 'visitors' | 'zone' | 'region';

export const NearbyCitiesRow: React.FC<Props> = ({ currentCity, allCities, onExploreAround, onSwitchCity }) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>('visitors');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // LOGICA OVERFLOW DETERMINISTICA
  const containerRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const popoverRef = useRef<HeaderPopoverHandle>(null);

  // Chiudi dropdown al click esterno
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, []);

  const filterOptions = [
    { id: 'visitors', label: 'Meta turistica', icon: Star },
    { id: 'zone', label: 'Zona turistica', icon: MapPin },
    { id: 'region', label: 'Area regionale', icon: Globe2 }
  ];

  const currentFilter = filterOptions.find(f => f.id === activeFilter) || filterOptions[0];

  const nearby = useMemo(() => {
    console.log('[CITY_TRACE] NearbyCitiesRow input', {
      id: currentCity?.id,
      name: currentCity?.name,
      coords: currentCity?.coords,
      hasCoords: !!currentCity?.coords
    });
    const candidateCities = allCities.filter(c => c.id !== currentCity.id);

    const withDistance = candidateCities.map(c => {
      const lat1 = Number(currentCity.coords.lat);
      const lng1 = Number(currentCity.coords.lng);
      const lat2 = Number(c.coords.lat);
      const lng2 = Number(c.coords.lng);

      const distance = calculateDistance(lat1, lng1, lat2, lng2);
      return { ...c, distance };
    });

    let selection: any[] = [];

    if (activeFilter === 'visitors') {
      selection = withDistance
        .filter(c => c.distance > 0 && c.distance <= 50)
        .sort((a, b) => (b.visitors || 0) - (a.visitors || 0));
    } else if (activeFilter === 'zone') {
      selection = withDistance
        .filter(c => c.zone_slug === (currentCity as any).zone_slug && c.distance <= 50)
        .sort((a, b) => a.distance - b.distance);
    } else if (activeFilter === 'region') {
      selection = withDistance
        .filter(c => c.region_slug === (currentCity as any).region_slug && c.distance <= 50)
        .sort((a, b) => a.distance - b.distance);
    }

    if (selection.length < 4) {
      const remaining = withDistance
        .filter(c => !selection.some(s => s.id === c.id))
        .sort((a, b) => {
          const aSameZone = a.zone_slug === (currentCity as any).zone_slug ? 1 : 0;
          const bSameZone = b.zone_slug === (currentCity as any).zone_slug ? 1 : 0;
          if (aSameZone !== bSameZone) return bSameZone - aSameZone;

          const aSameRegion = a.region_slug === (currentCity as any).region_slug ? 1 : 0;
          const bSameRegion = b.region_slug === (currentCity as any).region_slug ? 1 : 0;
          if (aSameRegion !== bSameRegion) return bSameRegion - aSameRegion;

          return a.distance - b.distance;
        });
      selection = [...selection, ...remaining];
    }

    return selection.slice(0, 4);
  }, [currentCity, allCities, activeFilter]);

  // FUNZIONE DI MISURAZIONE DETERMINISTICA (STABLE SLOT PATTERN - SUBPIXEL ACCURATE)
  const calculateOverflow = useCallback(() => {
    if (!containerRef.current || !ghostRef.current || nearby.length === 0) return;

    // Usiamo getBoundingClientRect per gestire subpixel rendering ed evitare flickering
    const containerWidth = Math.floor(containerRef.current.getBoundingClientRect().width);
    const ghostLabel = ghostRef.current.querySelector('.ghost-label') as HTMLElement;
    const ghostItems = ghostRef.current.querySelectorAll('.ghost-city-item');

    const labelWidth = ghostLabel ? Math.ceil(ghostLabel.getBoundingClientRect().width) : 0;

    // 1. Calcolo del totale reale (Label + Tutte le Città + Gaps)
    let totalNeeded = labelWidth;
    nearby.forEach((_, idx) => {
      const itemWidth = Math.ceil((ghostItems[idx] as HTMLElement).getBoundingClientRect().width);
      totalNeeded += GAP_WIDTH + itemWidth;
    });

    // Se tutto entra nel container con un margine di sicurezza conservativo di 4px, mostriamo tutto
    if (totalNeeded <= containerWidth - 4) {
      setVisibleCount(nearby.length);
      return;
    }

    // 2. Se non entra tutto, i "..." nello slot fisso sono OBBLIGATORI.
    let currentWidth = labelWidth;
    let count = 0;

    for (let i = 0; i < ghostItems.length; i++) {
      const itemWidth = Math.ceil((ghostItems[i] as HTMLElement).getBoundingClientRect().width);

      // Sottraiamo un buffer di sicurezza extra per evitare oscillazioni su alcuni browser
      if (currentWidth + GAP_WIDTH + itemWidth > containerWidth - 2) {
        break;
      }

      currentWidth += GAP_WIDTH + itemWidth;
      count++;
    }

    // Garantiamo che almeno una città sia nascosta se non entrano tutte (deterministico)
    setVisibleCount(Math.min(count, nearby.length - 1));
  }, [nearby]);

  useEffect(() => {
    const observer = new ResizeObserver(calculateOverflow);
    if (containerRef.current) observer.observe(containerRef.current);
    calculateOverflow();
    return () => observer.disconnect();
  }, [calculateOverflow]);

  const handleCityClick = (e: React.MouseEvent, cityId: string, path: string) => {
    if (onSwitchCity) {
      e.preventDefault();
      onSwitchCity(cityId);
    }
  };

  const handlePopoverCityClick = (e: React.MouseEvent, cityId: string, path: string) => {
    e.preventDefault();
    popoverRef.current?.close();
    if (onSwitchCity) {
      onSwitchCity(cityId);
    } else {
      // Piccolo delay per permettere la chiusura pulita del portale prima della navigazione
      setTimeout(() => navigate(path), 10);
    }
  };

  if (nearby.length === 0) return null;

  const visibleCities = nearby.slice(0, visibleCount);
  const hiddenCities = nearby.slice(visibleCount);

  return (
    <div
      className="w-full bg-slate-950/60 border-b border-slate-800/40 py-2 sm:py-2.5 relative select-none"
      style={{ zIndex: Z_FLOATING_PANEL }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.6)_0%,transparent_100%)] pointer-events-none" />

      {/* 
        LAYOUT DETERMINISTICO 3 COLONNE 
        - Col 1 & 3 sono 1fr per centrare Col 2
      */}
      <div className="relative max-w-[1400px] mx-auto px-4 grid grid-cols-[1fr_auto_1fr] items-center">

        {/* [SINISTRA - ALLINEATA A SX] */}
        <div className="flex items-center gap-2 sm:gap-4 justify-start">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 rounded-lg px-2.5 py-1.5 border border-slate-800 shadow-inner hover:border-slate-700 transition-all group active:scale-95"
            >
              <Star className="w-3 h-3 text-amber-500 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white whitespace-nowrap">
                {currentFilter.label}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterOpen && (
              <div className="absolute top-full left-0 mt-2 w-44 sm:w-48 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                {filterOptions.map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setActiveFilter(f.id as FilterType);
                      setIsFilterOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-800 ${activeFilter === f.id ? 'bg-amber-500/10 text-amber-500' : 'text-slate-400'}`}
                  >
                    <f.icon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{f.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-px h-4 bg-slate-800/80 shrink-0 hidden xs:block" />
        </div>

        {/* [CENTRO - DINAMICO CENTRATO] */}
        <div ref={containerRef} className="flex justify-center items-center px-4 overflow-hidden relative">

          {/* GHOST RENDERER PER MISURAZIONE (IDENTICO AL REALE) */}
          <div ref={ghostRef} className="absolute invisible opacity-0 pointer-events-none flex whitespace-nowrap items-center gap-2">
            <span className="ghost-label text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mr-2">
              Vicino a {currentCity.name}:
            </span>
            {nearby.map((city) => (
              <div
                key={city.id || city.slug}
                className="ghost-city-item px-3 py-1.5 border border-transparent text-[11px] font-bold flex items-center gap-2"
              >
                <span>{city.name}</span>
                <span className="text-[8px] font-mono">{Math.round(city.distance)}km</span>
              </div>
            ))}
          </div>

          {/* RENDERING REALE SEMANTICO */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden whitespace-nowrap">
            <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap shrink-0">
              Vicino a <span className="text-slate-300">{currentCity.name}</span>:
            </span>

            <div className="flex items-center gap-2 overflow-hidden">
              {visibleCities.map((city, idx) => {
                const segments = [city.continent_slug, city.nation_slug, city.region_slug, city.zone_slug, city.slug].filter(Boolean);
                const path = `/${segments.join('/')}`;

                return (
                  <React.Fragment key={city.id || city.slug}>
                    <Link
                      to={path}
                      onClick={(e) => handleCityClick(e, city.id, path)}
                      className="px-2.5 sm:px-3 py-1.5 bg-slate-900/40 border border-slate-800 rounded-xl text-[10px] sm:text-[11px] font-bold text-slate-400 hover:text-white hover:border-amber-500/40 hover:bg-slate-900 transition-all shadow-sm flex items-center gap-1.5 sm:gap-2 group/city focus-visible:ring-1 focus-visible:ring-amber-500 outline-none"
                    >
                      <span className="group-hover:text-amber-400 transition-colors">{city.name}</span>
                      <span className="text-[8px] opacity-30 font-mono font-normal shrink-0">{Math.round(city.distance)}km</span>
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
                  trigger={
                    <button
                      className="p-1.5 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-500 hover:text-amber-400 hover:border-amber-500/40 transition-all flex items-center justify-center active:scale-90"
                      aria-label="Mostra altre destinazioni"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  }
                >
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1.5 px-1 border-b border-slate-800/50 pb-1.5">Altre destinazioni</p>
                    {hiddenCities.map(city => {
                      const segments = [city.continent_slug, city.nation_slug, city.region_slug, city.zone_slug, city.slug].filter(Boolean);
                      const path = `/${segments.join('/')}`;
                      return (
                        <button
                          key={city.id || city.slug}
                          onClick={(e) => handlePopoverCityClick(e, city.id, path)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-800/80 text-slate-300 hover:text-white transition-all group text-left"
                        >
                          <span className="text-[11px] font-bold">{city.name}</span>
                          <span className="text-[9px] font-mono opacity-40 group-hover:opacity-100 transition-opacity">{Math.round(city.distance)}km</span>
                        </button>
                      );
                    })}
                  </div>
                </HeaderPopover>
              </div>
            ) : (
              // Spazio mantenuto ma invisibile per stabilità deterministica
              <div className="invisible" aria-hidden="true">| ...</div>
            )}
          </div>

          <div className="w-px h-4 bg-slate-800/80 shrink-0 hidden xs:block" />
          <CompassExploreButton onClick={(e) => { e.preventDefault(); onExploreAround(currentCity.id); }} />
        </div>

      </div>
    </div>
  );
};
