import {
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  Grid,
  Star,
  TrendingUp,
  ZoomIn,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CityCard } from '@/components/city/CityCard';
import { AdPlaceholder } from '@/components/common/AdPlaceholder';
import { DraggableSlider, type DraggableSliderHandle } from '@/components/common/DraggableSlider';
import { SponsorSideCard } from '@/components/common/SponsorSideCard';
import { CuratedGridSection } from '@/components/home/CuratedGridSection';
import { HeroSection } from '@/components/home/HeroSection';
import { useGps } from '@/context/GpsContext';
import { FOCUS_SURFACE_ATTR } from '@/focus/focusModeRegistry';
import { useMobileCompact } from '@/hooks/ui/useMobileCompact';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useDynamicContent } from '@/hooks/useDynamicContent';
import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import { fetchActiveSponsorsResolvedAsync } from '@/services/sponsors/sponsorContractsService';
import { convertSponsorToPoi } from '@/services/sponsors/sponsorResolvers';
import type { CitySummary, PointOfInterest, ResolvedSponsor } from '@/types';

interface HeroSectionProps {
  activeCategories: string[];
  setActiveCategories: (cats: string[]) => void;
  onSelectCity: (id: string) => void;
  selectedZone: string;
  setSelectedZone: (z: string) => void;
  selectedSeason: string;
  setSelectedSeason: (s: string) => void;
  onFilteredCitiesChange?: (cities: CitySummary[]) => void;
}

interface HomeContentProps {
  heroProps: HeroSectionProps;
  mostVisitedCities: CitySummary[];
  /** HomeShelf ordinato (vetrina). DOC-38 §S.4 */
  allMostVisitedCities?: CitySummary[];
  /**
   * CatalogRest per ricerca/filtri Hero (progressivo).
   * Vuoto al first paint; si popola quando il manifest è pronto.
   * Query server dedicata (PO-BOOT-06) resta follow-up senza cambiare UX corrente.
   */
  catalogForSearch?: CitySummary[];
  onCityClick: (id: string) => void;
  onExploreSection: (
    cities: CitySummary[],
    title: string,
    icon: React.ReactNode,
    categories?: { id: string; label: string; color: string; badge: string }[],
  ) => void;
  onAddToItinerary: (poi: PointOfInterest) => void;
  onOpenPoiDetail: (poi: PointOfInterest) => void;
  onOpenSponsor: (tier?: 'gold' | 'silver') => void;
}

const ISPIRAZIONI_CATEGORIES = [
  { id: 'destination', label: 'DESTINAZIONI TOP', color: 'text-indigo-500', badge: 'destination' },
  { id: 'events', label: 'EVENTI IN ARRIVO', color: 'text-rose-500', badge: 'event' },
  { id: 'season', label: 'IDEALE PER LA STAGIONE', color: 'text-emerald-500', badge: 'season' },
  { id: 'trends', label: 'TREND DEL MESE', color: 'text-blue-500', badge: 'trend' },
  { id: 'editor', label: 'SCELTA EDITORIALE', color: 'text-purple-500', badge: 'editor' },
];

const EXPLORE_BTN_LAYOUT =
  'group inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap';

const ExploreButton: React.FC<{ onClick: (e: React.MouseEvent) => void }> = ({ onClick }) => {
  const btnStyle = useDynamicStyles('btn_explore');
  return (
    <button
      type="button"
      onClick={onClick}
      className={btnStyle ? `${EXPLORE_BTN_LAYOUT} ${btnStyle}` : EXPLORE_BTN_LAYOUT}
    >
      <ZoomIn
        className="w-3.5 h-3.5 shrink-0 text-amber-500 group-hover:text-white transition-colors"
        aria-hidden
      />
      <span>ESPLORA</span>
    </button>
  );
};

const SectionHeaderWithAction = ({
  title,
  icon,
  color,
  onExplore,
  onScrollLeft,
  onScrollRight,
  subtitleConfig,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  onExplore: (e: React.MouseEvent) => void;
  onScrollLeft?: () => void;
  onScrollRight?: () => void;
  subtitleConfig?: { text?: string; style?: string };
}) => {
  const isMobile = useMobileCompact();

  const titleStyle = useDynamicStyles('section_title', isMobile);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-6 md:h-8 ${color} rounded-full`}></div>
          <h3 className={`flex items-center gap-3 ${titleStyle}`}>
            {icon}
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {onScrollLeft && onScrollRight && (
            <div className="flex bg-slate-900 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={onScrollLeft}
                aria-label="Scorri a sinistra"
                className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-white transition-colors border-r border-slate-800 rounded-l-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onScrollRight}
                aria-label="Scorri a destra"
                className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-white transition-colors rounded-r-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          <ExploreButton onClick={onExplore} />
        </div>
      </div>
      {subtitleConfig?.text && (
        <p className={`${subtitleConfig.style} ml-4`}>{subtitleConfig.text}</p>
      )}
    </div>
  );
};

const EmptyFeaturedCard: React.FC<{ label: string }> = ({ label }) => (
  <div className="w-[150px] md:w-[165px] lg:w-[145px] xl:w-[165px] h-[200px] md:h-[240px] flex-shrink-0 bg-slate-900/30 rounded-xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-4 text-center gap-2 group hover:border-slate-600 transition-colors snap-start">
    <AlertTriangle className="w-8 h-8 text-slate-700 group-hover:text-amber-500 transition-colors" />
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
    <div
      className={`px-2 py-1 rounded text-[9px] font-black uppercase text-white bg-slate-800 opacity-50`}
    >
      DISPONIBILE
    </div>
  </div>
);

export const HomeContent = ({
  heroProps,
  mostVisitedCities,
  allMostVisitedCities,
  catalogForSearch = [],
  onCityClick,
  onExploreSection,
  onAddToItinerary,
  onOpenPoiDetail,
  onOpenSponsor,
}: HomeContentProps) => {
  useDocumentTitle('Scopri la Campania');

  const { userLocation } = useGps();

  const featuredRef = useRef<DraggableSliderHandle>(null);
  const visitedRef = useRef<DraggableSliderHandle>(null);
  const sponsorContainerRef = useRef<HTMLDivElement>(null);

  const isMobile = useMobileCompact();

  const titleStyle = useDynamicStyles('section_title', isMobile);

  // NEW: USE DYNAMIC CONTENT FOR SUBTITLES
  const featuredSubtitle = useDynamicContent('home_featured_subtitle', isMobile);
  const visitedSubtitle = useDynamicContent('home_visited_subtitle', isMobile);
  const inspirationSubtitle = useDynamicContent('home_inspiration_subtitle', isMobile);

  const [goldSponsors, setGoldSponsors] = useState<ResolvedSponsor[]>([]);
  const [sponsorIndex, setSponsorIndex] = useState(0);
  const [sponsorCols, setSponsorCols] = useState(1);

  const [heroFilteredCities, setHeroFilteredCities] = useState<CitySummary[] | null>(null);
  const [seasonalRanking, setSeasonalRanking] = useState<
    { city_id: string; seasonal_score: number }[]
  >([]);

  const dynamicAllCities = useMemo(() => {
    return heroFilteredCities || allMostVisitedCities || mostVisitedCities || [];
  }, [heroFilteredCities, allMostVisitedCities, mostVisitedCities]);

  useEffect(() => {
    let cancelled = false;
    void fetchActiveSponsorsResolvedAsync()
      .then((all) => {
        if (cancelled) return;
        // Gold UI = runtime `tier` post-resolver (stesso contratto di CityShowcase/CityCategory).
        // SoT: pricing_versions.plans.type → resolvePlanTier → tier; non la sola colonna `type`
        // (può divergere). L’OR su REGIONAL_ACTIVITY era troppo permissivo (type Gold + pricing Silver).
        const gold = all.filter((s) => s.tier === 'gold');
        // UNIQUE SPONSOR PER HOME: ResolvedSponsor.id = id contratto `sponsors` (non poi id).
        const seen = new Set<string>();
        const unique: ResolvedSponsor[] = [];
        for (const s of gold) {
          if (seen.has(s.id)) continue;
          seen.add(s.id);
          unique.push(s);
        }
        setGoldSponsors(unique);
      })
      .catch((err) => {
        console.error('[HomeContent] fetchActiveSponsorsResolvedAsync failed', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = sponsorContainerRef.current;
    if (!el) return;
    const handleResize = () => {
      if (!el) return;
      const width = el.offsetWidth;
      // 300 ≈ md:w-72 (288) + gap-3 (12): passo colonna; floor è leggermente conservativo (no overflow).
      const cols = Math.floor(width / 300);
      setSponsorCols(Math.max(1, Math.min(4, cols)));
    };
    const observer = new ResizeObserver(handleResize);
    observer.observe(el);
    handleResize();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (goldSponsors.length <= 1) return;
    const count = goldSponsors.length;
    const interval = setInterval(() => {
      // Stesso ciclo di `sponsorIndex % length` in sponsorsToDisplay; evita crescita indefinita.
      setSponsorIndex((prev) => (prev + 1) % count);
    }, 8000);
    return () => clearInterval(interval);
  }, [goldSponsors.length]);

  // NEW: EFFECT FOR SEASONAL RANKING
  useEffect(() => {
    let cancelled = false;
    const loadSeasonalRanking = async () => {
      if (!heroProps.selectedSeason) {
        if (!cancelled) setSeasonalRanking([]);
        return;
      }

      const allCities = allMostVisitedCities || mostVisitedCities || [];
      const ids = allCities.map((c) => c.id);

      const { getSeasonalRanking } = await import('@/services/city/cityReadService');
      const ranking = await getSeasonalRanking(ids, heroProps.selectedSeason);
      if (cancelled) return;
      setSeasonalRanking(ranking);
    };
    void loadSeasonalRanking();
    return () => {
      cancelled = true;
    };
  }, [heroProps.selectedSeason, allMostVisitedCities, mostVisitedCities]);

  /**
   * Slot PARTNER (area In Evidenza): N celle = sponsorCols*2 (min 2).
   * Rotazione solo sull’ordine; NESSUN wrap modulo che ripeta lo stesso id.
   * Cella senza sponsor → null → AdPlaceholder (prodotto).
   */
  const sponsorsToDisplay = useMemo((): (ResolvedSponsor | null)[] => {
    const maxItems = Math.max(2, sponsorCols * 2);
    const slots: (ResolvedSponsor | null)[] = Array.from({ length: maxItems }, () => null);
    if (goldSponsors.length === 0) return slots;

    const start = sponsorIndex % goldSponsors.length;
    const ordered = [...goldSponsors.slice(start), ...goldSponsors.slice(0, start)];
    for (let i = 0; i < maxItems; i++) {
      slots[i] = ordered[i] ?? null;
    }
    return slots;
  }, [goldSponsors, sponsorIndex, sponsorCols]);

  /**
   * Griglia PARTNER inferiore (8 slot): solo sponsor NON già presenti nell’area superiore.
   * Identità = ResolvedSponsor.id (contratto sponsors), non poi id.
   * Slot restanti → null → AdPlaceholder.
   */
  const goldGridSlots = useMemo((): (ResolvedSponsor | null)[] => {
    const occupiedInUpper = new Set(
      sponsorsToDisplay.filter((s): s is ResolvedSponsor => s !== null).map((s) => s.id),
    );
    const remaining = goldSponsors.filter((s) => !occupiedInUpper.has(s.id));
    const slots: (ResolvedSponsor | null)[] = [...remaining.slice(0, 8)];
    while (slots.length < 8) {
      slots.push(null);
    }
    return slots;
  }, [goldSponsors, sponsorsToDisplay]);

  const featuredSlots = useMemo(() => {
    const slot1City = dynamicAllCities.find((c) => c.homeOrder === 1);
    const slot2City = dynamicAllCities.find((c) => c.homeOrder === 2);
    const slot3City = dynamicAllCities.find((c) => c.homeOrder === 3);
    const slot4City = dynamicAllCities.find((c) => c.homeOrder === 4);

    const getBadgeConfig = (city: CitySummary | undefined) => {
      const badge = city?.specialBadge;
      switch (badge) {
        case 'event':
          return { id: 'event', label: 'EVENTI IN ARRIVO', color: 'bg-rose-600' };
        case 'season':
          return { id: 'season', label: 'IDEALE STAGIONE', color: 'bg-emerald-600' };
        case 'trend':
          return { id: 'trend', label: 'TREND DEL MESE', color: 'bg-blue-600' };
        case 'editor':
          return { id: 'editor', label: 'SCELTA EDITORIALE', color: 'bg-purple-600' };
        case 'destination':
          return { id: 'destination', label: 'DESTINAZIONE TOP', color: 'bg-indigo-600' };
        default:
          return { id: 'destination', label: 'DESTINAZIONE TOP', color: 'bg-indigo-600' };
      }
    };

    const findFallback = (badge: string) =>
      dynamicAllCities.find((c) => c.specialBadge === badge && !c.homeOrder);

    // LOGICA STAGIONALE DINAMICA:
    // Se c'è un ranking stagionale attivo, le posizioni 1-4 sono i primi 4 della classifica
    if (seasonalRanking.length > 0) {
      const scoreByCityId = new Map(
        seasonalRanking.map((r) => [r.city_id, r.seasonal_score] as const),
      );
      const sortedBySeason = [...dynamicAllCities].sort((a, b) => {
        const scoreA = scoreByCityId.get(a.id) || 0;
        const scoreB = scoreByCityId.get(b.id) || 0;
        return scoreB - scoreA;
      });

      return [
        { city: sortedBySeason[0], config: getBadgeConfig(sortedBySeason[0]) },
        { city: sortedBySeason[1], config: getBadgeConfig(sortedBySeason[1]) },
        { city: sortedBySeason[2], config: getBadgeConfig(sortedBySeason[2]) },
        { city: sortedBySeason[3], config: getBadgeConfig(sortedBySeason[3]) },
      ];
    }

    const slots = [
      { city: slot1City || findFallback('event'), label: 'POSIZIONE 1' },
      { city: slot2City || findFallback('season'), label: 'POSIZIONE 2' },
      { city: slot3City || findFallback('trend'), label: 'POSIZIONE 3' },
      { city: slot4City || findFallback('editor'), label: 'POSIZIONE 4' },
    ];

    return slots.map((s) => {
      if (s.city) {
        return {
          city: s.city,
          config: getBadgeConfig(s.city),
        };
      }
      return {
        city: null,
        config: { id: 'empty', label: s.label, color: 'bg-slate-700' },
      };
    });
  }, [dynamicAllCities, seasonalRanking]);

  const renderSponsorCell = (sponsor: ResolvedSponsor | null, slotKey: string) => (
    <div className="h-full w-full min-h-0" key={slotKey}>
      {sponsor ? (
        <div className="h-full w-full animate-in fade-in duration-700">
          <SponsorSideCard
            poi={convertSponsorToPoi(sponsor)}
            onOpenDetail={onOpenPoiDetail}
            onAddToItinerary={onAddToItinerary}
          />
        </div>
      ) : (
        <AdPlaceholder
          label="Partner"
          onClick={() => onOpenSponsor('gold')}
          className="h-full w-full"
        />
      )}
    </div>
  );

  return (
    <div className="animate-in fade-in flex flex-col gap-0 w-full overflow-x-hidden">
      <div
        className="shrink-0 relative z-home-hero lg:sticky lg:top-0 lg:bg-[#020617] lg:pb-6 lg:pt-1 lg:border-b lg:border-slate-800/50 lg:shadow-2xl transition-all"
        data-focus-surface={FOCUS_SURFACE_ATTR.dimmedBackground}
      >
        <div className="mb-1 max-md:mb-0 lg:mb-0">
          <HeroSection
            activeCategories={heroProps.activeCategories}
            setActiveCategories={heroProps.setActiveCategories}
            onSelectCity={heroProps.onSelectCity}
            selectedZone={heroProps.selectedZone}
            setSelectedZone={heroProps.setSelectedZone}
            selectedSeason={heroProps.selectedSeason}
            setSelectedSeason={heroProps.setSelectedSeason}
            cityManifest={catalogForSearch}
            onFilteredCitiesChange={setHeroFilteredCities}
          />
        </div>
      </div>

      <div
        className="space-y-12 pb-10 pt-2 md:pt-6"
        data-focus-surface={FOCUS_SURFACE_ATTR.dimmedBackground}
      >
        <section>
          <div className="flex flex-col lg:flex-row gap-4 xl:gap-6 items-start">
            <div
              id="tour-featured-section"
              className="min-w-0 flex flex-col gap-4 shrink-0 max-w-full relative scroll-mt-40"
            >
              <div className="w-full xl:max-w-[calc(4*165px+3*16px)]">
                <div className="flex items-center justify-between h-10 mb-1">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 md:h-8 bg-amber-500 rounded-full"></div>
                    <h3 className={`flex items-center gap-3 ${titleStyle}`}>
                      <Star className="w-5 h-5 md:w-7 md:h-7 text-amber-500" /> In Evidenza
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex bg-slate-900 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => featuredRef.current?.scroll('left')}
                        aria-label="Scorri In Evidenza a sinistra"
                        className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-white transition-colors border-r border-slate-800 rounded-l-lg"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => featuredRef.current?.scroll('right')}
                        aria-label="Scorri In Evidenza a destra"
                        className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-white transition-colors rounded-r-lg"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <ExploreButton
                      onClick={() =>
                        onExploreSection(
                          dynamicAllCities,
                          'Ispirazioni di Viaggio',
                          <Grid className="w-5 h-5 text-indigo-500" />,
                          ISPIRAZIONI_CATEGORIES,
                        )
                      }
                    />
                  </div>
                </div>
                {featuredSubtitle.text && (
                  <p className={`${featuredSubtitle.style} mb-4 ml-4`}>{featuredSubtitle.text}</p>
                )}
              </div>

              <div>
                <DraggableSlider ref={featuredRef} className="pb-4">
                  {featuredSlots.map((slot, idx) => {
                    if (slot.city) {
                      return (
                        <div
                          key={slot.city.id + slot.config.id}
                          className="snap-start flex-shrink-0"
                        >
                          <CityCard
                            city={slot.city}
                            onClick={onCityClick}
                            userLocation={userLocation}
                            forcedBadge={slot.config.id}
                            priority={false}
                          />
                        </div>
                      );
                    } else {
                      return <EmptyFeaturedCard key={`empty-${idx}`} label={slot.config.label} />;
                    }
                  })}
                </DraggableSlider>
              </div>
            </div>

            <div
              ref={sponsorContainerRef}
              id="tour-partners"
              className="w-full lg:flex-1 flex justify-center min-w-0 px-2 lg:px-0"
            >
              <div className="flex flex-col gap-4 items-center w-full lg:w-fit">
                <div className="flex items-center justify-center gap-2 h-10 mb-2 w-full">
                  <div className="h-px flex-1 bg-amber-500/50"></div>
                  <div className="flex items-center gap-2 px-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                      PARTNER
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-amber-500/50"></div>
                </div>

                <div className="flex justify-center gap-3 w-full">
                  {sponsorCols >= 1 && (
                    <div className="flex flex-col gap-3 w-full md:w-72 shrink-0 h-[280px] md:h-[240px]">
                      {renderSponsorCell(sponsorsToDisplay[0], 'partner-slot-0')}
                      {renderSponsorCell(sponsorsToDisplay[1], 'partner-slot-1')}
                    </div>
                  )}
                  {sponsorCols >= 2 && (
                    <div className="flex flex-col gap-3 w-full md:w-72 shrink-0 h-[280px] md:h-[240px]">
                      {renderSponsorCell(sponsorsToDisplay[2], 'partner-slot-2')}
                      {renderSponsorCell(sponsorsToDisplay[3], 'partner-slot-3')}
                    </div>
                  )}
                  {sponsorCols >= 3 && (
                    <div className="flex flex-col gap-3 w-full md:w-72 shrink-0 h-[280px] md:h-[240px]">
                      {renderSponsorCell(sponsorsToDisplay[4], 'partner-slot-4')}
                      {renderSponsorCell(sponsorsToDisplay[5], 'partner-slot-5')}
                    </div>
                  )}
                  {sponsorCols >= 4 && (
                    <div className="flex flex-col gap-3 w-full md:w-72 shrink-0 h-[280px] md:h-[240px]">
                      {renderSponsorCell(sponsorsToDisplay[6], 'partner-slot-6')}
                      {renderSponsorCell(sponsorsToDisplay[7], 'partner-slot-7')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-[100vw] overflow-hidden">
          <SectionHeaderWithAction
            title="Le Più Visitate"
            icon={<TrendingUp className="w-5 h-5 md:w-7 md:h-7 text-rose-500" />}
            color="bg-rose-500"
            onExplore={() =>
              onExploreSection(
                dynamicAllCities,
                'Le Più Visitate',
                <TrendingUp className="w-5 h-5 text-rose-500" />,
              )
            }
            onScrollLeft={() => visitedRef.current?.scroll('left')}
            onScrollRight={() => visitedRef.current?.scroll('right')}
            subtitleConfig={visitedSubtitle}
          />

          <div id="tour-most-visited-section">
            <DraggableSlider ref={visitedRef} className="pb-4">
              {dynamicAllCities.slice(0, 10).map((city) => (
                <div key={city.id || city.slug} className="snap-start flex-shrink-0">
                  <CityCard
                    city={city}
                    onClick={onCityClick}
                    userLocation={userLocation}
                    priority={false}
                  />
                </div>
              ))}
            </DraggableSlider>
          </div>
        </section>

        <section id="tour-categories-section" className="w-full max-w-[100vw] overflow-hidden">
          <SectionHeaderWithAction
            title="Ispirazioni di Viaggio"
            icon={<Grid className="w-5 h-5 md:w-7 md:h-7 text-indigo-500" />}
            color="bg-indigo-500"
            onExplore={() =>
              onExploreSection(
                dynamicAllCities,
                'Ispirazioni di Viaggio',
                <Grid className="w-5 h-5 text-indigo-500" />,
                ISPIRAZIONI_CATEGORIES,
              )
            }
            subtitleConfig={inspirationSubtitle}
          />
          <CuratedGridSection
            onCityClick={onCityClick}
            onExplore={(c, t, i) => onExploreSection(c, t, i)}
            cityManifest={dynamicAllCities}
          />
        </section>

        <section className="pt-8">
          <div className="flex items-center justify-center gap-2 h-10 mb-6">
            <div className="h-px flex-1 bg-amber-500/50"></div>
            <div className="flex items-center gap-2 px-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                PARTNER
              </span>
            </div>
            <div className="h-px flex-1 bg-amber-500/50"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {goldGridSlots.map((s, i) => (
              <div key={s?.id || `empty-${i}`} className="w-full h-32 md:h-44">
                {s ? (
                  <SponsorSideCard
                    poi={convertSponsorToPoi(s)}
                    onOpenDetail={onOpenPoiDetail}
                    onAddToItinerary={onAddToItinerary}
                  />
                ) : (
                  <AdPlaceholder
                    label="Partner Gold"
                    onClick={() => onOpenSponsor('gold')}
                    className="h-full w-full border-amber-500/30"
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
