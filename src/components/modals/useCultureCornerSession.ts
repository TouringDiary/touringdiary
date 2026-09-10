import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DraggableSliderHandle } from '@/components/common/DraggableSlider';
import {
  type CultureFilterState,
  emptyCultureFilters,
  filterFamousPeople,
} from '@/domain/city/famousPersonFilter';
import {
  loadCultureSession,
  resolveSelectionOnFirstFilter,
  resolveSelectionOnOpen,
  resolveSelectionOnSubsequentFilter,
  saveCultureSession,
} from '@/domain/city/famousPersonSelection';
import type { CityDetails, FamousPerson } from '../../types/index';

export interface CategoryOption {
  slug: string;
  label: string;
  masterSlug: string;
  masterLabel: string;
  orderIndex: number;
  masterOrderIndex: number;
}

interface UseCultureCornerSessionProps {
  isOpen: boolean;
  city: CityDetails;
  people: FamousPerson[];
  initialPersonId?: string;
  allSpecificOptions: CategoryOption[];
  timelineRef: RefObject<DraggableSliderHandle | null>;
  railRef: RefObject<DraggableSliderHandle | null>;
  setDetailPersonId: (id: string | null) => void;
  syncScrollToSelection: (personId: string | null, behavior: ScrollBehavior) => void;
}

export function useCultureCornerSession({
  isOpen,
  city,
  people,
  initialPersonId,
  allSpecificOptions,
  timelineRef,
  railRef,
  setDetailPersonId,
  syncScrollToSelection,
}: UseCultureCornerSessionProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [filters, setFilters] = useState<CultureFilterState>(emptyCultureFilters);
  const [hasAppliedFilter, setHasAppliedFilter] = useState(false);
  const [scrollNonce, setScrollNonce] = useState(0);

  const lastCityIdRef = useRef<string | null>(null);
  const hydratedOpenRef = useRef<'none' | 'empty' | 'populated'>('none');
  const pendingScrollRestoreRef = useRef<{ timeline: number; rail: number } | null>(null);
  const pendingSyncIdRef = useRef<string | null>(null);

  // Keep latest state in a ref to avoid dependency re-runs in hydration useEffect
  const latestStateRef = useRef({ selectedPersonId, filters, hasAppliedFilter });
  useEffect(() => {
    latestStateRef.current = { selectedPersonId, filters, hasAppliedFilter };
  }, [selectedPersonId, filters, hasAppliedFilter]);

  const persistSessionForCity = useCallback(
    (
      cityId: string | null,
      currentSelectedId: string | null,
      currentFilters: CultureFilterState,
      currentHasApplied: boolean,
    ) => {
      if (!cityId) return;
      saveCultureSession(cityId, {
        selectedPersonId: currentSelectedId,
        filters: currentFilters,
        scrollTimeline: timelineRef.current?.getScrollLeft() ?? 0,
        scrollRail: railRef.current?.getScrollLeft() ?? 0,
        hasAppliedFilter: currentHasApplied,
      });
    },
    [timelineRef, railRef],
  );

  const persistSession = useCallback(() => {
    persistSessionForCity(lastCityIdRef.current, selectedPersonId, filters, hasAppliedFilter);
  }, [persistSessionForCity, selectedPersonId, filters, hasAppliedFilter]);

  // Clean-up and restore state on city change or modal open/close
  useEffect(() => {
    if (!isOpen) {
      if (hydratedOpenRef.current !== 'none' && lastCityIdRef.current) {
        // Modal is closing, persist current state
        persistSessionForCity(
          lastCityIdRef.current,
          latestStateRef.current.selectedPersonId,
          latestStateRef.current.filters,
          latestStateRef.current.hasAppliedFilter,
        );
      }
      hydratedOpenRef.current = 'none';
      pendingScrollRestoreRef.current = null;
      pendingSyncIdRef.current = null;
      lastCityIdRef.current = null;
      return;
    }

    const cityChanged = lastCityIdRef.current !== null && lastCityIdRef.current !== city.id;

    if (cityChanged) {
      // Save old city session
      persistSessionForCity(
        lastCityIdRef.current,
        latestStateRef.current.selectedPersonId,
        latestStateRef.current.filters,
        latestStateRef.current.hasAppliedFilter,
      );
      // Reset hydration flag to trigger complete re-hydration for new city
      hydratedOpenRef.current = 'none';
    }

    if (hydratedOpenRef.current === 'populated') return;
    if (hydratedOpenRef.current === 'empty' && people.length === 0) return;

    lastCityIdRef.current = city.id;
    const isPopulated = people.length > 0;
    hydratedOpenRef.current = isPopulated ? 'populated' : 'empty';

    const memory = loadCultureSession(city.id);
    const restoredFilters = memory?.filters ?? emptyCultureFilters();
    const restoredHasFilter = memory?.hasAppliedFilter ?? false;

    setFilters(restoredFilters);
    setHasAppliedFilter(restoredHasFilter);

    const filteredForOpen = filterFamousPeople(people, restoredFilters);
    let nextSelected = resolveSelectionOnOpen({
      people: filteredForOpen,
      memory,
    });

    if (initialPersonId && people.some((p) => p.id === initialPersonId)) {
      nextSelected = initialPersonId;
      setDetailPersonId(initialPersonId);
    } else {
      setDetailPersonId(null);
    }

    setSelectedPersonId(nextSelected);

    if (memory && memory.selectedPersonId === nextSelected) {
      pendingScrollRestoreRef.current = {
        timeline: memory.scrollTimeline,
        rail: memory.scrollRail,
      };
    } else {
      pendingSyncIdRef.current = nextSelected;
    }
    setScrollNonce((n) => n + 1);
  }, [isOpen, city.id, people, initialPersonId, persistSessionForCity, setDetailPersonId]);

  // One-shot scroll after selection / filter / hydrate (driven by scrollNonce).
  useEffect(() => {
    if (!isOpen || scrollNonce === 0) return;

    let rafId = 0;

    const restore = pendingScrollRestoreRef.current;
    if (restore) {
      pendingScrollRestoreRef.current = null;
      rafId = requestAnimationFrame(() => {
        timelineRef.current?.setScrollLeft(restore.timeline);
        railRef.current?.setScrollLeft(restore.rail);
      });
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }

    const syncId = pendingSyncIdRef.current;
    if (syncId) {
      pendingSyncIdRef.current = null;
      rafId = requestAnimationFrame(() => {
        syncScrollToSelection(syncId, 'auto');
      });
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  }, [isOpen, scrollNonce, syncScrollToSelection, timelineRef, railRef]);

  const applyFilterChange = useCallback(
    (nextFilters: CultureFilterState) => {
      let pruned = nextFilters;
      if (nextFilters.masterSlugs.length > 0) {
        const allowed = new Set(
          allSpecificOptions
            .filter((s) => nextFilters.masterSlugs.includes(s.masterSlug))
            .map((s) => s.slug),
        );
        pruned = {
          ...nextFilters,
          specificSlugs: nextFilters.specificSlugs.filter((slug) => allowed.has(slug)),
        };
      }

      const nextFiltered = filterFamousPeople(people, pruned);
      const nextSelected = !hasAppliedFilter
        ? resolveSelectionOnFirstFilter({ filteredPeople: nextFiltered })
        : resolveSelectionOnSubsequentFilter({
            filteredPeople: nextFiltered,
            currentSelectedId: selectedPersonId,
          });

      setFilters(pruned);
      setHasAppliedFilter(true);
      setSelectedPersonId(nextSelected);
      pendingSyncIdRef.current = nextSelected;
      setScrollNonce((n) => n + 1);
    },
    [allSpecificOptions, hasAppliedFilter, people, selectedPersonId],
  );

  const clearFilters = useCallback(() => {
    applyFilterChange(emptyCultureFilters());
  }, [applyFilterChange]);

  return {
    selectedPersonId,
    setSelectedPersonId,
    filters,
    setFilters,
    hasAppliedFilter,
    scrollNonce,
    persistSession,
    applyFilterChange,
    clearFilters,
  };
}
