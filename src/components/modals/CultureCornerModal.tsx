import { ArrowUpLeft, BookOpen, Filter, Quote } from 'lucide-react';
import {
  type MutableRefObject,
  type RefObject,
  type TransitionEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { CarouselPositionIndicator } from '@/components/ui/CarouselPositionIndicator';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { Z_MODAL, Z_OVERLAY } from '@/constants/zIndex';
import { useItinerary } from '@/context/ItineraryContext';
import { filterFamousPeople, hasActiveCultureFilters } from '@/domain/city/famousPersonFilter';
import { comparePeopleChronological } from '@/domain/city/famousPersonSelection';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import type { CityDetails, PointOfInterest } from '../../types/index';
import type { User } from '../../types/users';
import type { DraggableSliderHandle } from '../common/DraggableSlider';
import { CultureCornerCommunity } from './CultureCornerCommunity';
// Component & Hook Imports
import { CultureCornerFilters } from './CultureCornerFilters';
import { CultureCornerPeopleRail } from './CultureCornerPeopleRail';
import { CultureCornerTimeline } from './CultureCornerTimeline';
import { CulturePersonDetailPanel } from './CulturePersonDetailModal';
import { type DerivedPersonData, derivePeopleData } from './cultureCornerUtils';
import {
  type FamousPersonOfficialPhotoTarget,
  ReportFamousPersonPhotoAbuseModal,
} from './ReportFamousPersonPhotoAbuseModal';
import { SuggestFamousPersonModal } from './SuggestFamousPersonModal';
import { SuggestFamousPersonPhotoModal } from './SuggestFamousPersonPhotoModal';
import { type CategoryOption, useCultureCornerSession } from './useCultureCornerSession';
import { useCultureCornerTimeline } from './useCultureCornerTimeline';

/** Tab trap locale sul dialog (stesso pattern di AdminFamousPeopleManager / ReportAbuse). */
function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null && !el.closest('[inert]'),
  );
}

function focusIsInsideAllowedRoots(
  target: Node,
  dialog: HTMLElement,
  extraContainers: RefObject<HTMLElement | null>[],
): boolean {
  if (dialog.contains(target)) return true;
  return extraContainers.some((ref) => ref.current?.contains(target));
}

/** Local focus-trap; ESC handled separately via useGlobalModalEscape. */
function useDialogFocusTrap(
  active: boolean,
  isOpen: boolean,
  dialogRef: RefObject<HTMLDivElement | null>,
  openerRef: MutableRefObject<HTMLElement | null>,
  extraContainers: RefObject<HTMLElement | null>[] = [],
): void {
  const trapActiveRef = useRef(active);
  trapActiveRef.current = active;

  // 1. Capture opener and perform initial focus ONCE when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Capture opener safely
    const activeEl = document.activeElement;
    if (activeEl instanceof HTMLElement) {
      openerRef.current = activeEl;
    } else {
      openerRef.current = null;
    }

    const dialog = dialogRef.current;
    const focusRaf = requestAnimationFrame(() => {
      if (!trapActiveRef.current) return;
      if (dialog) {
        const focusable = getFocusableElements(dialog);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          dialog.focus();
        }
      }
    });

    return () => {
      cancelAnimationFrame(focusRaf);
    };
  }, [isOpen, dialogRef, openerRef]);

  // 2. Active focus trap (Tab/Shift+Tab and focusin redirection) when active
  useEffect(() => {
    if (!isOpen || !active) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;
      if (event.shiftKey && (activeEl === first || activeEl === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || focusIsInsideAllowedRoots(target, dialog, extraContainers)) {
        if (target instanceof HTMLElement && target.closest('[inert]')) {
          const focusable = getFocusableElements(dialog);
          (focusable[0] ?? dialog).focus();
        }
        return;
      }
      const focusable = getFocusableElements(dialog);
      (focusable[0] ?? dialog).focus();
    };

    dialog.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [active, isOpen, dialogRef, extraContainers]);

  // 3. Handle final restoration only when modal is fully unmounted/closed
  useEffect(() => {
    if (!isOpen) {
      const opener = openerRef.current;
      openerRef.current = null;
      if (
        opener instanceof HTMLElement &&
        document.contains(opener) &&
        typeof opener.focus === 'function' &&
        !opener.hasAttribute('disabled')
      ) {
        opener.focus();
      }
    }
  }, [isOpen, openerRef]);
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  city: CityDetails;
  onAddToItinerary: (poi: PointOfInterest) => void;
  initialPersonId?: string;
  user?: User | null;
  onOpenAuth?: () => void;
}

const RAIL_ARROW_MIN = 3;

export const CultureCornerModal = ({
  isOpen,
  onClose,
  city,
  onAddToItinerary,
  initialPersonId,
  user = null,
  onOpenAuth,
}: Props) => {
  const { itinerary } = useItinerary();
  const listTitleId = useId();

  const [detailPersonId, setDetailPersonId] = useState<string | null>(null);
  const [isDetailFlipped, setIsDetailFlipped] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showSuggestPersonModal, setShowSuggestPersonModal] = useState(false);
  const [showSuggestPhotoModal, setShowSuggestPhotoModal] = useState(false);
  const [reportPhotoTarget, setReportPhotoTarget] =
    useState<FamousPersonOfficialPhotoTarget | null>(null);

  const timelineRef = useRef<DraggableSliderHandle>(null);
  const railRef = useRef<DraggableSliderHandle>(null);
  const filterAnchorRef = useRef<HTMLButtonElement>(null);
  const filtersPanelRef = useRef<HTMLDivElement>(null);
  const mainDialogRef = useRef<HTMLDivElement>(null);
  const mainOpenerRef = useRef<HTMLElement | null>(null);
  const galleryFaceRef = useRef<HTMLDivElement>(null);
  const detailFaceRef = useRef<HTMLDivElement>(null);
  const backToGalleryRef = useRef<HTMLButtonElement>(null);
  const filteredDerivedPeopleRef = useRef<DerivedPersonData[]>([]);
  const prevDetailPersonIdRef = useRef<string | null>(null);

  const people = useMemo(() => {
    const raw = city.details.famousPeople || [];
    return [...raw].sort(comparePeopleChronological);
  }, [city.details.famousPeople]);

  // Pre-derive all categories and person statistics
  const derivedPeople = useMemo(() => {
    return derivePeopleData(people, city);
  }, [people, city]);

  const masterOptions = useMemo(() => {
    const map = new Map<string, { slug: string; label: string; orderIndex: number }>();
    for (const person of people) {
      for (const cat of person.categories ?? []) {
        if (cat.isActive === false) continue;
        if (map.has(cat.masterSlug)) continue;
        map.set(cat.masterSlug, {
          slug: cat.masterSlug,
          label: cat.masterLabel,
          orderIndex: cat.masterOrderIndex,
        });
      }
    }
    return [...map.values()].sort(
      (a, b) => a.orderIndex - b.orderIndex || a.slug.localeCompare(b.slug),
    );
  }, [people]);

  const allSpecificOptions = useMemo(() => {
    const map = new Map<string, CategoryOption>();
    for (const person of people) {
      for (const cat of person.categories ?? []) {
        if (cat.isActive === false) continue;
        if (map.has(cat.specificSlug)) continue;
        map.set(cat.specificSlug, {
          slug: cat.specificSlug,
          label: cat.specificLabel,
          masterSlug: cat.masterSlug,
          masterLabel: cat.masterLabel,
          orderIndex: cat.specificOrderIndex,
          masterOrderIndex: cat.masterOrderIndex,
        });
      }
    }
    return [...map.values()].sort(
      (a, b) =>
        a.masterOrderIndex - b.masterOrderIndex ||
        a.orderIndex - b.orderIndex ||
        a.slug.localeCompare(b.slug),
    );
  }, [people]);

  const syncScrollToSelection = useCallback(
    (personId: string | null, behavior: ScrollBehavior = 'smooth') => {
      if (!personId) return;
      const idx = filteredDerivedPeopleRef.current.findIndex((p) => p.id === personId);
      if (idx < 0) return;
      timelineRef.current?.scrollToChild(idx, behavior);
      railRef.current?.scrollToChild(idx, behavior);
    },
    [],
  );

  const {
    selectedPersonId,
    setSelectedPersonId,
    filters,
    scrollNonce,
    persistSession,
    applyFilterChange,
    clearFilters,
  } = useCultureCornerSession({
    isOpen,
    city,
    people,
    initialPersonId,
    allSpecificOptions,
    timelineRef,
    railRef,
    setDetailPersonId,
    syncScrollToSelection,
  });

  const filteredPeople = useMemo(() => filterFamousPeople(people, filters), [people, filters]);

  // Align derived filtered people
  const filteredDerivedPeople = useMemo(() => {
    return derivedPeople.filter((dp) => filteredPeople.some((p) => p.id === dp.id));
  }, [derivedPeople, filteredPeople]);

  filteredDerivedPeopleRef.current = filteredDerivedPeople;

  const selectedIndex = useMemo(() => {
    if (!selectedPersonId) return -1;
    return filteredDerivedPeople.findIndex((p) => p.id === selectedPersonId);
  }, [filteredDerivedPeople, selectedPersonId]);

  const selectedPerson = useMemo(
    () => filteredDerivedPeople.find((p) => p.id === selectedPersonId) ?? null,
    [filteredDerivedPeople, selectedPersonId],
  );

  const detailPerson = useMemo(() => {
    if (!detailPersonId) return null;
    return people.find((p) => p.id === detailPersonId) ?? null;
  }, [people, detailPersonId]);

  const isDetailFlippedActive = isDetailFlipped;
  const isDetailLifecycleActive = detailPersonId != null && detailPerson != null;

  const visibleSpecificOptions = useMemo(() => {
    if (filters.masterSlugs.length === 0) return allSpecificOptions;
    const masters = new Set(filters.masterSlugs);
    return allSpecificOptions.filter((s) => masters.has(s.masterSlug));
  }, [allSpecificOptions, filters.masterSlugs]);

  const showRailArrows = filteredPeople.length >= RAIL_ARROW_MIN;
  const filtersActive = hasActiveCultureFilters(filters);

  const isPlaceInItinerary = useCallback(
    (placeId: string) => itinerary.items.some((item) => item.poi.id === placeId),
    [itinerary.items],
  );

  const selectPerson = useCallback(
    (personId: string, options?: { openDetail?: boolean; syncBehavior?: ScrollBehavior }) => {
      setSelectedPersonId(personId);
      syncScrollToSelection(personId, options?.syncBehavior ?? 'smooth');
      if (options?.openDetail) {
        setDetailPersonId(personId);
        setIsDetailFlipped(true);
        setFiltersOpen(false);
      }
    },
    [syncScrollToSelection, setSelectedPersonId],
  );

  useEffect(() => {
    const prev = prevDetailPersonIdRef.current;
    prevDetailPersonIdRef.current = detailPersonId;
    if (detailPersonId != null && prev !== detailPersonId) {
      setIsDetailFlipped(true);
    }
  }, [detailPersonId]);

  const toggleMaster = useCallback(
    (slug: string) => {
      const next = filters.masterSlugs.includes(slug)
        ? filters.masterSlugs.filter((s) => s !== slug)
        : [...filters.masterSlugs, slug];
      applyFilterChange({ ...filters, masterSlugs: next });
    },
    [filters, applyFilterChange],
  );

  const toggleSpecific = useCallback(
    (slug: string) => {
      const next = filters.specificSlugs.includes(slug)
        ? filters.specificSlugs.filter((s) => s !== slug)
        : [...filters.specificSlugs, slug];
      applyFilterChange({ ...filters, specificSlugs: next });
    },
    [filters, applyFilterChange],
  );

  const handleCloseModal = useCallback(() => {
    persistSession();
    setDetailPersonId(null);
    setIsDetailFlipped(false);
    setFiltersOpen(false);
    onClose();
  }, [onClose, persistSession]);

  const closeDetail = useCallback(() => {
    if (!isDetailFlipped) return;
    setIsDetailFlipped(false);
  }, [isDetailFlipped]);

  const handleFlipTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (event.propertyName !== 'transform' || event.target !== event.currentTarget) return;
      if (isDetailFlipped) return;
      setDetailPersonId(null);
      const galleryRoot = galleryFaceRef.current;
      if (!galleryRoot) return;
      const focusable = getFocusableElements(galleryRoot);
      focusable[0]?.focus();
    },
    [isDetailFlipped],
  );

  const openSuggestPerson = useCallback(() => {
    if (!user || user.role === 'guest') {
      onOpenAuth?.();
      return;
    }
    setShowSuggestPersonModal(true);
  }, [user, onOpenAuth]);

  const openSuggestPhoto = useCallback(() => {
    if (!user || user.role === 'guest') {
      onOpenAuth?.();
      return;
    }
    if (!selectedPerson?.id) return;
    setShowSuggestPhotoModal(true);
  }, [user, onOpenAuth, selectedPerson]);

  const openReportAbuse = useCallback(() => {
    if (!user || user.role === 'guest') {
      onOpenAuth?.();
      return;
    }
    if (!selectedPerson?.id || !selectedPerson.person.imageUrl?.trim()) return;
    setReportPhotoTarget({
      personId: selectedPerson.id,
      imageUrl: selectedPerson.person.imageUrl,
      personName: selectedPerson.name,
    });
  }, [user, onOpenAuth, selectedPerson]);

  useEffect(() => {
    if (!isDetailLifecycleActive) return;
    setFiltersOpen(false);
  }, [isDetailLifecycleActive]);

  useEffect(() => {
    if (!isDetailFlippedActive) return;
    backToGalleryRef.current?.focus();
  }, [isDetailFlippedActive]);

  // Central body scroll lock manager
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Keyboard Navigation: ESC logic
  useGlobalModalEscape(
    isOpen &&
      !isDetailFlippedActive &&
      !showSuggestPersonModal &&
      !showSuggestPhotoModal &&
      reportPhotoTarget == null,
    handleCloseModal,
  );
  useGlobalModalEscape(
    isOpen &&
      isDetailFlippedActive &&
      !showSuggestPersonModal &&
      !showSuggestPhotoModal &&
      reportPhotoTarget == null,
    closeDetail,
  );

  const mainModalTrapActive =
    isOpen && !showSuggestPersonModal && !showSuggestPhotoModal && reportPhotoTarget === null;

  const filterFocusRoots = useMemo(() => [filtersPanelRef], []);
  useDialogFocusTrap(mainModalTrapActive, isOpen, mainDialogRef, mainOpenerRef, filterFocusRoots);

  const { viewportYears, timelineCanScrollLeft, timelineCanScrollRight } = useCultureCornerTimeline(
    {
      isOpen,
      filteredPeople,
      scrollNonce,
      timelineRef,
    },
  );

  if (!isOpen) return null;

  const subModalOpen =
    showSuggestPersonModal || showSuggestPhotoModal || reportPhotoTarget !== null;

  return createPortal(
    <div
      className="td-modal-overlay bg-black/90 backdrop-blur-sm animate-in fade-in !p-4"
      style={{ zIndex: Z_OVERLAY }}
      role="presentation"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-transparent p-0"
        onClick={handleCloseModal}
      />
      <div
        ref={mainDialogRef}
        tabIndex={-1}
        className="relative bg-[#020617] w-full max-w-6xl h-full md:max-h-[85vh] md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 pointer-events-auto outline-none"
        style={{ zIndex: Z_MODAL }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={listTitleId}
        inert={subModalOpen ? true : undefined}
        aria-hidden={subModalOpen ? true : undefined}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center gap-3 px-6 py-5 border-b border-slate-800 bg-[#020617] shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/20 text-white shrink-0">
              <Quote className="w-6 h-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2
                id={listTitleId}
                className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-wide leading-none"
              >
                Angolo Cultura
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 truncate">
                I Grandi Personaggi di {city.name}
                {filteredPeople.length > 0 ? (
                  <span className="text-slate-600 normal-case tracking-normal font-medium ml-2">
                    ({filteredPeople.length}
                    {filtersActive ? ` / ${people.length}` : ''})
                  </span>
                ) : null}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            {isDetailFlippedActive ? (
              <button
                ref={backToGalleryRef}
                type="button"
                onClick={closeDetail}
                aria-label="Torna alla galleria"
                className="inline-flex items-center justify-center gap-2 min-h-11 min-w-11 px-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:border-indigo-500/50 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
              >
                <ArrowUpLeft className="w-4 h-4 text-amber-500 shrink-0" aria-hidden />
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                  Torna alla galleria
                </span>
              </button>
            ) : null}
            <button
              ref={filterAnchorRef}
              type="button"
              disabled={isDetailLifecycleActive}
              onClick={() => {
                if (isDetailLifecycleActive) return;
                setFiltersOpen((v) => !v);
              }}
              aria-expanded={filtersOpen && !isDetailLifecycleActive}
              aria-haspopup="dialog"
              aria-label="Filtri Angolo Cultura"
              aria-disabled={isDetailLifecycleActive ? true : undefined}
              className={`inline-flex items-center justify-center gap-2 min-h-11 min-w-11 px-3 rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-700 disabled:hover:text-slate-300 ${
                filtersActive || filtersOpen
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-indigo-500/50 hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4" aria-hidden />
              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest">
                Filtri
              </span>
            </button>
            <CloseButton onClose={handleCloseModal} variant="primary" />
          </div>
        </div>

        <CultureCornerFilters
          isOpen={filtersOpen && !isDetailLifecycleActive}
          onClose={() => setFiltersOpen(false)}
          anchorRef={filterAnchorRef}
          panelRef={filtersPanelRef}
          filters={filters}
          filtersActive={filtersActive}
          masterOptions={masterOptions}
          visibleSpecificOptions={visibleSpecificOptions}
          toggleMaster={toggleMaster}
          toggleSpecific={toggleSpecific}
          clearFilters={clearFilters}
          applyFilterChange={applyFilterChange}
        />

        {/* BODY: flip 3D galleria ↔ dettaglio (stesso pattern POI recensioni) */}
        <div className="flex-1 min-h-0 relative perspective-1000 overflow-hidden bg-slate-950">
          <div
            onTransitionEnd={handleFlipTransitionEnd}
            className={`absolute inset-0 transition-transform duration-700 transform-style-3d ${isDetailFlippedActive ? 'rotate-y-180' : ''}`}
          >
            {/* FRONT — galleria (resta montata per preservare scroll/indice) */}
            <div
              ref={galleryFaceRef}
              inert={isDetailFlippedActive ? true : undefined}
              className={`absolute inset-0 backface-hidden overflow-y-auto overflow-x-hidden p-4 md:p-8 custom-scrollbar flex flex-col ${isDetailFlippedActive ? 'pointer-events-none' : ''}`}
              aria-hidden={isDetailFlippedActive ? true : undefined}
            >
              {people.length === 0 ? (
                <div className="flex-1 min-h-[16rem] flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                  <BookOpen className="w-16 h-16" aria-hidden />
                  <p className="text-sm font-medium italic text-center">
                    Nessun personaggio illustre ancora in archivio per questa città.
                  </p>
                </div>
              ) : filteredPeople.length === 0 ? (
                <div className="flex-1 min-h-[16rem] flex flex-col items-center justify-center text-slate-500 gap-3">
                  <p className="text-sm font-medium text-center">
                    Nessun personaggio corrisponde ai filtri selezionati.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded min-h-11 px-4"
                  >
                    Reimposta filtri
                  </button>
                </div>
              ) : (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="shrink-0 space-y-0">
                    <CultureCornerTimeline
                      timelineRef={timelineRef}
                      derivedPeople={filteredDerivedPeople}
                      selectedPersonId={selectedPersonId}
                      selectPerson={selectPerson}
                      viewportYears={viewportYears}
                      timelineCanScrollLeft={timelineCanScrollLeft}
                      timelineCanScrollRight={timelineCanScrollRight}
                    />

                    <p className="sr-only" aria-live="polite">
                      Periodo inquadrato nella timeline:
                      {viewportYears.minYear == null && viewportYears.maxYear == null
                        ? ' non disponibile'
                        : ` da ${viewportYears.minYear} a ${viewportYears.maxYear}`}
                    </p>

                    <div className="border-t border-slate-800/80 mt-5 mb-5" aria-hidden />

                    <CultureCornerPeopleRail
                      railRef={railRef}
                      derivedPeople={filteredDerivedPeople}
                      selectedPersonId={selectedPersonId}
                      selectPerson={selectPerson}
                      showRailArrows={showRailArrows}
                    />

                    <CarouselPositionIndicator
                      mode="index"
                      count={filteredPeople.length}
                      selectedIndex={Math.max(0, selectedIndex)}
                      className="pt-5 mt-2"
                    />
                  </div>

                  <CultureCornerCommunity
                    onSuggestPerson={openSuggestPerson}
                    onSuggestPhoto={openSuggestPhoto}
                    onReportAbuse={openReportAbuse}
                    hasSelectedPerson={selectedPerson !== null}
                    hasSelectedPersonImage={
                      selectedPerson !== null &&
                      typeof selectedPerson.person.imageUrl === 'string' &&
                      selectedPerson.person.imageUrl.trim().length > 0
                    }
                    showExtraActions
                  />
                </div>
              )}

              {(people.length === 0 || filteredPeople.length === 0) && (
                <CultureCornerCommunity onSuggestPerson={openSuggestPerson} />
              )}
            </div>

            {/* BACK — dettaglio personaggio */}
            {detailPerson ? (
              <div
                ref={detailFaceRef}
                inert={!isDetailFlippedActive ? true : undefined}
                className="absolute inset-0 backface-hidden rotate-y-180 overflow-hidden"
                aria-hidden={!isDetailFlippedActive ? true : undefined}
              >
                <CulturePersonDetailPanel
                  detailPerson={detailPerson}
                  showToolbar={false}
                  isPlaceInItinerary={isPlaceInItinerary}
                  onAddToItinerary={onAddToItinerary}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {user ? (
        <SuggestFamousPersonModal
          isOpen={showSuggestPersonModal}
          onClose={() => setShowSuggestPersonModal(false)}
          cityId={city.id}
          cityName={city.name}
          user={user}
          onOpenAuth={onOpenAuth}
        />
      ) : null}

      {user && selectedPerson?.id ? (
        <SuggestFamousPersonPhotoModal
          key={selectedPerson.id}
          isOpen={showSuggestPhotoModal}
          onClose={() => setShowSuggestPhotoModal(false)}
          personId={selectedPerson.id}
          personName={selectedPerson.name}
          cityName={city.name}
          user={user}
          onOpenAuth={onOpenAuth}
        />
      ) : null}

      <ReportFamousPersonPhotoAbuseModal
        isOpen={reportPhotoTarget !== null}
        onClose={() => setReportPhotoTarget(null)}
        photo={reportPhotoTarget}
        cityId={city.id}
        cityName={city.name}
        user={user}
        onOpenAuth={onOpenAuth}
      />
    </div>,
    document.body,
  );
};
