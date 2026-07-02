import { useCallback, useEffect, useRef, useState } from 'react';
import type { Itinerary } from '@/types';
import type { PointOfInterest } from '@/types/models/City';
import { getPoisByIds } from '@/services/cityService';
import { isDiaryPersisted } from '@/utils/suitcaseAssociation';
import {
  buildPoiCatalogUpdateSignature,
  getCatalogPoiIds,
  hasPoiCatalogUpdates,
  mergePoiCatalogUpdates,
} from '@/domain/diary/poiCatalogSync';

interface UseDiaryPoiCatalogUpdatePromptOptions {
  itinerary: Itinerary;
  savedProjects: Itinerary[];
  setItinerary: React.Dispatch<React.SetStateAction<Itinerary>>;
}

export function useDiaryPoiCatalogUpdatePrompt({
  itinerary,
  savedProjects,
  setItinerary,
}: UseDiaryPoiCatalogUpdatePromptOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const itineraryRef = useRef(itinerary);
  itineraryRef.current = itinerary;

  const pendingFreshPoisRef = useRef<PointOfInterest[]>([]);
  const skippedSignaturesRef = useRef<Map<string, string>>(new Map());
  const checkedDiaryIdRef = useRef<string | null>(null);

  const clearPendingFreshPois = useCallback(() => {
    pendingFreshPoisRef.current = [];
  }, []);

  const dismissPrompt = useCallback(() => {
    const current = itineraryRef.current;
    const diaryId = current.id;
    const signature = buildPoiCatalogUpdateSignature(
      current.items,
      pendingFreshPoisRef.current,
    );
    if (diaryId && signature) {
      skippedSignaturesRef.current.set(diaryId, signature);
    }
    clearPendingFreshPois();
    setIsOpen(false);
  }, [clearPendingFreshPois]);

  const confirmPrompt = useCallback(async () => {
    setIsApplying(true);
    try {
      const freshPois = pendingFreshPoisRef.current;
      const current = itineraryRef.current;
      setItinerary((prev) => ({
        ...prev,
        items: mergePoiCatalogUpdates(prev.items, freshPois),
      }));
      const diaryId = current.id;
      const signature = buildPoiCatalogUpdateSignature(current.items, freshPois);
      if (diaryId && signature) {
        skippedSignaturesRef.current.set(diaryId, signature);
      }
      setIsOpen(false);
    } finally {
      setIsApplying(false);
      clearPendingFreshPois();
    }
  }, [clearPendingFreshPois, setItinerary]);

  useEffect(() => {
    const diaryId = itinerary.id;
    if (checkedDiaryIdRef.current !== diaryId) {
      checkedDiaryIdRef.current = null;
    }

    if (!diaryId || !isDiaryPersisted(itineraryRef.current, savedProjects)) {
      return;
    }

    if (checkedDiaryIdRef.current === diaryId) return;

    let cancelled = false;

    const runCheck = async () => {
      const current = itineraryRef.current;
      const ids = getCatalogPoiIds(current.items);
      if (ids.length === 0) {
        checkedDiaryIdRef.current = diaryId;
        return;
      }

      try {
        const freshPois = await getPoisByIds(ids);
        if (cancelled) return;

        if (!hasPoiCatalogUpdates(current.items, freshPois)) {
          return;
        }

        const signature = buildPoiCatalogUpdateSignature(current.items, freshPois);
        if (skippedSignaturesRef.current.get(diaryId) === signature) {
          return;
        }

        pendingFreshPoisRef.current = freshPois;
        setIsOpen(true);
      } catch {
        clearPendingFreshPois();
      } finally {
        if (!cancelled) {
          checkedDiaryIdRef.current = diaryId;
        }
      }
    };

    void runCheck();

    return () => {
      cancelled = true;
    };
  }, [itinerary.id, savedProjects, clearPendingFreshPois]);

  return {
    isOpen,
    isApplying,
    dismissPrompt,
    confirmPrompt,
  };
}
