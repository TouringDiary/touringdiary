import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getAllPremadeItinerariesAsync,
  getOpenReviewRatingAlerts,
  getUnifiedReviews,
  type ReviewRatingAlert,
} from '../../../services/communityService';
import type { PremadeItinerary, Review } from '../../../types/index';
import {
  buildEnrichmentCache,
  EMPTY_ENRICHMENT,
  type EnrichmentCache,
} from './itineraryManagerGeo';

export function useItineraryManagerData(editingItineraryId: string | null) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [alerts, setAlerts] = useState<ReviewRatingAlert[]>([]);
  const [allOptions, setAllOptions] = useState<PremadeItinerary[]>([]);
  const [enrichment, setEnrichment] = useState<EnrichmentCache>(EMPTY_ENRICHMENT);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  /** Monotonic generation: stale async responses must not apply state. */
  const enrichmentGenRef = useRef(0);
  /** Owner of isInitialLoading — only the latest loading-managed call may clear it. */
  const loadingEpochRef = useRef(0);
  /** True after the first real catalog fetch completed (even if empty). */
  const catalogFetchedRef = useRef(false);
  const allOptionsRef = useRef<PremadeItinerary[]>([]);
  allOptionsRef.current = allOptions;

  /** Una sola passata di enrichment al load / refresh sorgenti (non in render). */
  const refreshReviewsAlertsAndEnrichment = useCallback(async () => {
    const gen = ++enrichmentGenRef.current;
    let catalog = allOptionsRef.current;
    const needCatalog = !catalogFetchedRef.current;

    const [allReviews, openAlerts, fetchedCatalog] = await Promise.all([
      getUnifiedReviews(),
      getOpenReviewRatingAlerts().catch(() => [] as ReviewRatingAlert[]),
      needCatalog ? getAllPremadeItinerariesAsync() : Promise.resolve(catalog),
    ]);

    if (gen !== enrichmentGenRef.current) return;

    if (needCatalog) {
      catalog = fetchedCatalog;
      catalogFetchedRef.current = true;
      setAllOptions(fetchedCatalog);
    }

    const sortedReviews = [...allReviews].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    setReviews(sortedReviews);
    setAlerts(openAlerts);

    const poiIds = [
      ...openAlerts.map((a) => a.poiId),
      ...sortedReviews.map((r) => r.poiId).filter((id): id is string => Boolean(id)),
    ];
    const cache = await buildEnrichmentCache(poiIds, catalog);
    if (gen !== enrichmentGenRef.current) return;
    setEnrichment(cache);
  }, []);

  const refreshData = useCallback(async () => {
    const epoch = ++loadingEpochRef.current;
    setIsInitialLoading(true);
    try {
      await refreshReviewsAlertsAndEnrichment();
    } finally {
      if (epoch === loadingEpochRef.current) setIsInitialLoading(false);
    }
  }, [refreshReviewsAlertsAndEnrichment]);

  // Reviews + alerts + enrichment + catalogo itinerari: mount e ritorno da editor — NON sui filtri geo
  useEffect(() => {
    if (editingItineraryId) return;
    let cancelled = false;
    const epoch = ++loadingEpochRef.current;
    (async () => {
      setIsInitialLoading(true);
      try {
        await refreshReviewsAlertsAndEnrichment();
      } finally {
        if (!cancelled && epoch === loadingEpochRef.current) {
          setIsInitialLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      // Invalida risposte in volo (apertura editor / unmount / re-run).
      enrichmentGenRef.current += 1;
    };
  }, [editingItineraryId, refreshReviewsAlertsAndEnrichment]);

  return {
    reviews,
    alerts,
    allOptions,
    enrichment,
    isInitialLoading,
    refreshReviewsAlertsAndEnrichment,
    refreshData,
  };
}
