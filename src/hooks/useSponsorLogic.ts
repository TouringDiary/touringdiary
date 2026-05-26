
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as sponsorService from '../services/sponsorService';
import { usePersistedState } from './usePersistedState';
import { SponsorRequest, SponsorStats, GeoFilters, GeoOptions, SortConfig } from '../types/models/Sponsor';
import { SponsorLifecycleStatus } from '../types/shared/SponsorStatus';
import { CitySummary } from '../types/index';
import * as geoService from '../services/geo';
import { getFullManifestAsync } from '../services/cityService';

// 1. TIPI CORRETTI
// Tipizzazione delle tab della UI
// Tipizzazione delle tab della UI
export type SponsorTab = 'dashboard' | 'pending' | 'waiting' | 'approved' | 'expired' | 'rejected' | 'cancelled';
// Tipizzazione degli status reali del database (con l'aggiunta di 'converted')
type SponsorStatus = SponsorLifecycleStatus;

// 2. MAPPATURA CORRETTA
// Oggetto per mappare le tab della UI agli status del DB
const tabToStatusMap: Record<SponsorTab, SponsorStatus | null> = {
    dashboard: null, // La dashboard non esegue query di lista
    pending: 'pending',
    waiting: 'waiting_payment',
    approved: 'approved',
    expired: 'expired', // Mappato a 'expired' (il service gestirà la logica runtime)
    rejected: 'rejected',
    cancelled: 'cancelled',
};

export const useSponsorLogic = () => {
    const [requests, setRequests] = useState<SponsorRequest[]>([]);
    const [manifest, setManifest] = useState<CitySummary[]>([]);
    const [stats, setStats] = useState<SponsorStats>({ 
        pending: 0, 
        waiting: 0, 
        approved: 0, 
        expired: 0, 
        rejected: 0, 
        cancelled: 0,
        converted: 0,
        unreadMessages: 0
    });
    const [activeTab, setActiveTab] = useState<SponsorTab>('dashboard');
    const [isLoading, setIsLoading] = useState(false);

    // Filtri & Paginazione
    const [filters, setFilters] = useState<GeoFilters>({});
    const [sortConfig, setSortConfig] = useState<SortConfig<SponsorRequest>>({ key: 'date', direction: 'desc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = usePersistedState('sponsor-page-size', 10);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [onlyUnread, setOnlyUnread] = useState(false);
    
    // Opzioni per i filtri geografici
    const [options, setOptions] = useState<GeoOptions>({ continents: [], nations: [], adminRegions: [], zones: [], cities: [], tiers: [] });
    const fetchGenerationRef = useRef(0);
    const lastStructuralKeyRef = useRef('');

    const fetchGeoOptions = useCallback(async () => {
        const continents = await geoService.getContinents();
        const tiers = await sponsorService.getSponsorTiers();
        setOptions(prev => ({ ...prev, continents, tiers }));
    }, []);

    const handleContinentChange = async (continentId: string) => {
        setFilters({ continent: continentId, nation: undefined, adminRegion: undefined, zone: undefined, cityId: undefined });
        const nations = continentId ? await geoService.getNations(continentId) : [];
        setOptions(prev => ({ ...prev, nations, adminRegions: [], zones: [], cities: [] }));
    };

    const handleNationChange = async (nationId: string) => {
        setFilters(prev => ({ ...prev, nation: nationId, adminRegion: undefined, zone: undefined, cityId: undefined }));
        const adminRegions = nationId ? await geoService.getAdminRegions(nationId) : [];
        setOptions(prev => ({ ...prev, adminRegions, zones: [], cities: [] }));
    };
    
    const handleAdminRegionChange = async (adminRegionId: string) => {
        setFilters(prev => ({ ...prev, adminRegion: adminRegionId, zone: undefined, cityId: undefined }));
        const zones = adminRegionId ? await geoService.getZones(adminRegionId) : [];
        setOptions(prev => ({ ...prev, zones, cities: [] }));
    };

    const handleZoneChange = async (zoneId: string) => {
        setFilters(prev => ({ ...prev, zone: zoneId, cityId: undefined }));
        const cities = zoneId ? await geoService.getCitiesByZone(zoneId) : [];
        setOptions(prev => ({...prev, cities}));
    };

    const handleCityChange = (cityId: string | undefined) => {
        setFilters(prev => ({ ...prev, cityId: cityId }));
    };

    const handleTierChange = (tier: string | undefined) => {
        setFilters(prev => ({ ...prev, tier }));
    };
    
    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= Math.ceil(totalItems / pageSize)) {
            setPage(newPage);
        }
    };

    const appliedFilters = useMemo(() => ({
        ...filters,
        onlyUnread,
    }), [filters, onlyUnread]);

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

        console.log(`[FetchData] 🚀 START | Tab: ${activeTab} | Status: ${queryStatus} | Page: ${page} | Filters:`, appliedFilters);

        const isStale = () => requestId !== fetchGenerationRef.current;

        // Se siamo in dashboard, carichiamo dati aggregati per le statistiche città
        if (activeTab === 'dashboard') {
            try {
                const data = await sponsorService.getSponsorsDashboardAsync();
                if (isStale()) return;
                console.log(`[FetchData] 📊 Dashboard Data Loaded: ${data.length} records`);
                setRequests(data);
                setTotalItems(data.length);
            } catch (error) {
                if (isStale()) return;
                console.error("Errore nel caricamento dati dashboard:", error);
                setRequests([]);
            } finally {
                if (!isStale()) setIsLoading(false);
            }
            return;
        }

        if (!queryStatus) {
            console.log(`[FetchData] ⚠️ No query status for tab: ${activeTab}. Clearing requests.`);
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
                searchTerm
            });

            if (isStale()) return;
            
            console.log(`[FetchData] ✅ Success | Status: ${queryStatus} | Retrieved: ${data?.length || 0}/${count || 0}`);
            setRequests(data || []);
            setTotalItems(count || 0);

        } catch (error) {
            if (isStale()) return;
            console.error("Errore nel recuperare gli sponsor:", error);
            setRequests([]);
            setTotalItems(0);
        } finally {
            if (!isStale()) setIsLoading(false);
        }
    }, [activeTab, page, pageSize, appliedFilters, sortConfig, searchTerm]);

    const fetchStats = useCallback(async () => {
       const statsData = await sponsorService.getSponsorStats();
       setStats(statsData);
    }, []);

    const refreshData = useCallback(() => {
        fetchData();
        fetchStats();
    }, [fetchData, fetchStats]);

    useEffect(() => {
        fetchGeoOptions();
    }, [fetchGeoOptions]);

    useEffect(() => {
        getFullManifestAsync().then(setManifest);
    }, []);
    
    // --- MODIFICA STABILIZZAZIONE FETCH ---
    // 1. useEffect per i parametri che NON resettano la pagina (paginazione, ordinamento)
    useEffect(() => {
        // Se siamo già alla pagina 1, refreshData verrà chiamato dall'effetto sotto
        // al cambio di tab/filtri. Se non siamo alla 1, refreshData viene chiamato qui.
        refreshData();
    }, [page, pageSize, sortConfig]);

    // 2. useEffect per i parametri che RESETTANO la pagina (tab, filtri, ricerca)
    useEffect(() => {
        if (page !== 1) {
            setPage(1);
            // Non chiamiamo refreshData() qui perché setPage(1) 
            // scatenerà l'effetto sopra (visto che page cambia).
        } else {
            // Se eravamo già alla pagina 1, il primo effetto non vedrebbe
            // cambiamenti, quindi forziamo il refresh qui.
            refreshData();
        }
    }, [activeTab, appliedFilters, searchTerm]);
    // --- FINE MODIFICA STABILIZZAZIONE ---

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
        page, pageSize, totalItems,
        searchTerm,
        options,
        
        // Setters
        setSortConfig,
        setSearchTerm,
        setOnlyUnread,
        handleContinentChange,
        handleNationChange,
        handleAdminRegionChange,
        handleZoneChange,
        handleCityChange,
        handleTierChange,
        setPageSize,
        handlePageChange,
        
        // Refresh Action
        refreshData
    };
};