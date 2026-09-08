import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PLATFORM_FEATURE_FLAG_KEYS } from '../constants/platformFeatureFlags';
import { useFeatureFlag } from '../context/PlatformControlContext';
import { getFullManifestAsync } from '../services/cityService';
import * as geoService from '../services/geo';
import * as sponsorService from '../services/sponsorService';
import {
  enrichSponsorsWithRatings,
  isBelowRatingThreshold,
} from '../services/sponsors/sponsorRatingService';
import type { CitySummary } from '../types/index';
import type {
  GeoFilters,
  GeoOptions,
  SortConfig,
  SponsorRequest,
  SponsorStats,
} from '../types/models/Sponsor';
import type { SponsorLifecycleStatus } from '../types/shared/SponsorStatus';
import { CRITICAL_RATING_THRESHOLD } from '../utils/sponsorValidation';
import { usePersistedState } from './usePersistedState';

// Tipizzazione delle tab della UI
export type SponsorTab =
  | 'dashboard'
  | 'pending'
  | 'waiting'
  | 'approved'
  | 'disconnected'
  | 'expired'
  | 'rejected'
  | 'cancelled';
// Tipizzazione degli status reali del database (con l'aggiunta di 'converted')
type SponsorStatus = SponsorLifecycleStatus;

// 2. MAPPATURA CORRETTA
// Oggetto per mappare le tab della UI agli status del DB
const tabToStatusMap: Record<SponsorTab, SponsorStatus | null> = {
  dashboard: null, // La dashboard non esegue query di lista
  pending: 'pending',
  waiting: 'waiting_payment',
  approved: 'approved',
  disconnected: 'disconnected',
  expired: 'expired', // Mappato a 'expired' (il service gestirà la logica runtime)
  rejected: 'rejected',
  cancelled: 'cancelled',
};

export const useSponsorLogic = () => {
  const ratingThresholdFlag = useFeatureFlag(PLATFORM_FEATURE_FLAG_KEYS.SPONSOR_RATING_THRESHOLD);
  const ratingThreshold =
    typeof ratingThresholdFlag?.effectiveValue === 'number'
      ? ratingThresholdFlag.effectiveValue
      : CRITICAL_RATING_THRESHOLD;
  const ratingThresholdRef = useRef(ratingThreshold);
  ratingThresholdRef.current = ratingThreshold;

  const [requests, setRequests] = useState<SponsorRequest[]>([]);
  const [manifest, setManifest] = useState<CitySummary[]>([]);
  const [stats, setStats] = useState<SponsorStats>({
    pending: 0,
    waiting: 0,
    approved: 0,
    disconnected: 0,
    expired: 0,
    rejected: 0,
    cancelled: 0,
    converted: 0,
    unreadMessages: 0,
  });
  const [activeTab, setActiveTab] = useState<SponsorTab>('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Filtri & Paginazione
  const [filters, setFilters] = useState<GeoFilters>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'date',
    direction: 'desc',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = usePersistedState('sponsor-page-size', 10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [onlyBelowRatingThreshold, setOnlyBelowRatingThreshold] = useState(false);

  // Opzioni per i filtri geografici
  const [options, setOptions] = useState<GeoOptions>({
    continents: [],
    nations: [],
    adminRegions: [],
    zones: [],
    cities: [],
    tiers: [],
  });
  const fetchGenerationRef = useRef(0);
  const lastStructuralKeyRef = useRef('');

  const fetchGeoOptions = useCallback(async () => {
    const continents = await geoService.getContinents();
    const tiers = await sponsorService.getSponsorTiers();
    setOptions((prev) => ({ ...prev, continents, tiers }));
  }, []);

  const handleContinentChange = async (continentId: string) => {
    setFilters({
      continent: continentId,
      nation: undefined,
      adminRegion: undefined,
      zone: undefined,
      cityId: undefined,
    });
    const nations = continentId ? await geoService.getNations(continentId) : [];
    setOptions((prev) => ({ ...prev, nations, adminRegions: [], zones: [], cities: [] }));
  };

  const handleNationChange = async (nationId: string) => {
    setFilters((prev) => ({
      ...prev,
      nation: nationId,
      adminRegion: undefined,
      zone: undefined,
      cityId: undefined,
    }));
    const adminRegions = nationId ? await geoService.getAdminRegions(nationId) : [];
    setOptions((prev) => ({ ...prev, adminRegions, zones: [], cities: [] }));
  };

  const handleAdminRegionChange = async (adminRegionId: string) => {
    setFilters((prev) => ({
      ...prev,
      adminRegion: adminRegionId,
      zone: undefined,
      cityId: undefined,
    }));
    const zones = adminRegionId ? await geoService.getZones(adminRegionId) : [];
    setOptions((prev) => ({ ...prev, zones, cities: [] }));
  };

  const handleZoneChange = async (zoneId: string) => {
    setFilters((prev) => ({ ...prev, zone: zoneId, cityId: undefined }));
    const cities = zoneId ? await geoService.getCitiesByZone(zoneId) : [];
    setOptions((prev) => ({ ...prev, cities }));
  };

  const handleCityChange = (cityId: string | undefined) => {
    setFilters((prev) => ({ ...prev, cityId: cityId }));
  };

  const handleTierChange = (tier: string | undefined) => {
    setFilters((prev) => ({ ...prev, tier }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= Math.ceil(totalItems / pageSize)) {
      setPage(newPage);
    }
  };

  const appliedFilters = useMemo(
    () => ({
      ...filters,
      onlyUnread,
      onlyBelowRatingThreshold: activeTab === 'approved' ? onlyBelowRatingThreshold : false,
    }),
    [filters, onlyUnread, onlyBelowRatingThreshold, activeTab],
  );

  const fetchData = useCallback(async () => {
    const requestId = ++fetchGenerationRef.current;
    setIsLoading(true);
    const queryStatus = tabToStatusMap[activeTab];

    // Svuota solo al cambio tab/filtri strutturali; su paginazione/ordinamento mantiene la lista visibile (no flash vuoto).
    const structuralKey = `${activeTab}|${JSON.stringify(appliedFilters)}|${searchTerm}`;
    if (structuralKey !== lastStructuralKeyRef.current) {
      setRequests([]);
      lastStructuralKeyRef.current = structuralKey;
    }

    const isStale = () => requestId !== fetchGenerationRef.current;

    // Se siamo in dashboard, carichiamo dati aggregati per le statistiche città
    if (activeTab === 'dashboard') {
      try {
        const data = await sponsorService.getSponsorsDashboardAsync();
        if (isStale()) return;
        setRequests(data);
        setTotalItems(data.length);
      } catch (error) {
        if (isStale()) return;
        console.error('Errore nel caricamento dati dashboard:', error);
        setRequests([]);
      } finally {
        if (!isStale()) setIsLoading(false);
      }
      return;
    }

    if (!queryStatus) {
      if (!isStale()) {
        setRequests([]);
        setIsLoading(false);
      }
      return;
    }

    try {
      const { data, count } = await sponsorService.getSponsorsPaginated({
        page,
        pageSize,
        status: queryStatus,
        filters: appliedFilters,
        sortConfig,
        searchTerm,
      });

      if (isStale()) return;

      let rows = data || [];
      // Filtro sotto-soglia: page-scoped (post-enrichment). totalItems resta
      // il count DB degli approved — la paginazione scorre tutte le pagine;
      // ogni pagina mostra solo i match. Coerente senza query aggiuntive.
      if (queryStatus === 'approved') {
        rows = await enrichSponsorsWithRatings(rows);
        if (isStale()) return;
        if (onlyBelowRatingThreshold) {
          rows = rows.filter((r) => isBelowRatingThreshold(r.rating, ratingThresholdRef.current));
        }
      }

      if (isStale()) return;
      setRequests(rows);
      setTotalItems(count || 0);
    } catch (error) {
      if (isStale()) return;
      console.error('Errore nel recuperare gli sponsor:', error);
      setRequests([]);
      setTotalItems(0);
    } finally {
      if (!isStale()) setIsLoading(false);
    }
  }, [activeTab, page, pageSize, appliedFilters, sortConfig, searchTerm, onlyBelowRatingThreshold]);

  const fetchStats = useCallback(async () => {
    const statsData = await sponsorService.getSponsorStats();
    setStats(statsData);
  }, []);

  // Identità stabile: le effect di trigger non devono rieseguire solo perché fetchData cambia.
  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;
  const fetchStatsRef = useRef(fetchStats);
  fetchStatsRef.current = fetchStats;

  const refreshData = useCallback(async () => {
    await Promise.all([fetchDataRef.current(), fetchStatsRef.current()]);
  }, []);

  useEffect(() => {
    fetchGeoOptions();
  }, [fetchGeoOptions]);

  useEffect(() => {
    getFullManifestAsync().then(setManifest);
  }, []);

  // --- STABILIZZAZIONE FETCH ---
  // Effect A: paginazione / pageSize / ordinamento
  // Effect B: tab / filtri / ricerca (reset page → Effect A; se già page 1 → refresh qui)
  // Effect C: solo cambio ratingThreshold (gate via ref: evita doppio fetch con Effect B)
  const skipStructuralRefreshOnceRef = useRef(true);
  const pageResetFromStructuralRef = useRef(false);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const onlyBelowRatingThresholdRef = useRef(onlyBelowRatingThreshold);
  onlyBelowRatingThresholdRef.current = onlyBelowRatingThreshold;

  useEffect(() => {
    // Trigger espliciti: refreshData è identity-stable; senza questi deps il reload non partirebbe.
    void page;
    void pageSize;
    void sortConfig;
    void refreshData();
  }, [page, pageSize, sortConfig, refreshData]);

  useEffect(() => {
    void activeTab;
    void appliedFilters;
    void searchTerm;
    if (page !== 1) {
      pageResetFromStructuralRef.current = true;
      setPage(1);
      return;
    }
    if (skipStructuralRefreshOnceRef.current) {
      skipStructuralRefreshOnceRef.current = false;
      return;
    }
    // Reset page da Effect B: Effect A ha già (o sta per) caricare la nuova pagina 1.
    if (pageResetFromStructuralRef.current) {
      pageResetFromStructuralRef.current = false;
      return;
    }
    void refreshData();
  }, [activeTab, appliedFilters, searchTerm, page, refreshData]);

  useEffect(() => {
    void ratingThreshold;
    if (activeTabRef.current !== 'approved' || !onlyBelowRatingThresholdRef.current) return;
    void refreshData();
  }, [ratingThreshold, refreshData]);
  // --- FINE STABILIZZAZIONE FETCH ---

  return {
    requests,
    manifest,
    stats,
    activeTab,
    setActiveTab,
    isLoading,

    // Filtri & Paginazione
    filters: appliedFilters,
    sortConfig,
    page,
    pageSize,
    totalItems,
    searchTerm,
    options,

    // Setters
    setSortConfig,
    setSearchTerm,
    setOnlyUnread,
    setOnlyBelowRatingThreshold,
    handleContinentChange,
    handleNationChange,
    handleAdminRegionChange,
    handleZoneChange,
    handleCityChange,
    handleTierChange,
    setPageSize,
    handlePageChange,

    // Refresh Action
    refreshData,
    ratingThreshold,
  };
};
