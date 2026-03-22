
import { useState, useEffect, useCallback, useMemo } from 'react';
import * as sponsorService from '../services/sponsorService';
import { usePersistedState } from './usePersistedState';
import { SortConfig } from '../types/core';
import { SponsorRequest, SponsorStats, SponsorManifest } from '../types/sponsors';
import { GeoFilters, GeoOptions } from '../types/geo';
import * as geoService from '../services/geo';

// 1. TIPI CORRETTI
// Tipizzazione delle tab della UI
type SponsorTab = 'dashboard' | 'pending' | 'waiting' | 'approved' | 'rejected' | 'cancelled';
// Tipizzazione degli status reali del database
type SponsorStatus = 'pending' | 'waiting_payment' | 'approved' | 'rejected' | 'cancelled';

// 2. MAPPATURA CORRETTA
// Oggetto per mappare le tab della UI agli status del DB
const tabToStatusMap: Record<SponsorTab, SponsorStatus | null> = {
    dashboard: null, // La dashboard non esegue query di lista
    pending: 'pending',
    waiting: 'waiting_payment',
    approved: 'approved',
    rejected: 'rejected',
    cancelled: 'cancelled',
};

export const useSponsorLogic = () => {
    const [requests, setRequests] = useState<SponsorRequest[]>([]);
    const [manifest, setManifest] = useState<SponsorManifest[]>([]);
    const [stats, setStats] = useState<Partial<SponsorStats>>({});
    const [activeTab, setActiveTab] = usePersistedState<SponsorTab>('sponsor-active-tab', 'dashboard');
    const [isLoading, setIsLoading] = useState(false);

    // Filtri & Paginazione
    const [filters, setFilters] = useState<GeoFilters>({});
    const [sortConfig, setSortConfig] = useState<SortConfig<SponsorRequest>>({ key: 'createdAt', direction: 'desc' });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = usePersistedState('sponsor-page-size', 10);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [onlyUnread, setOnlyUnread] = useState(false);
    
    // Opzioni per i filtri geografici
    const [options, setOptions] = useState<GeoOptions>({ continents: [], nations: [], adminRegions: [], zones: [], cities: [], tiers: [] });

    const fetchGeoOptions = useCallback(async () => {
        const continents = await geoService.getContinents();
        const tiers = await sponsorService.getSponsorTiers();
        setOptions(prev => ({ ...prev, continents, tiers }));
    }, []);

    const handleContinentChange = async (continentId: string) => {
        setFilters({ continent: continentId, nation: undefined, adminRegion: undefined, zone: undefined, city: undefined });
        const nations = continentId ? await geoService.getNations(continentId) : [];
        setOptions(prev => ({ ...prev, nations, adminRegions: [], zones: [], cities: [] }));
    };

    const handleNationChange = async (nationId: string) => {
        setFilters(prev => ({ ...prev, nation: nationId, adminRegion: undefined, zone: undefined, city: undefined }));
        const adminRegions = nationId ? await geoService.getAdminRegions(nationId) : [];
        setOptions(prev => ({ ...prev, adminRegions, zones: [], cities: [] }));
    };
    
    const handleAdminRegionChange = async (adminRegionId: string) => {
        setFilters(prev => ({ ...prev, adminRegion: adminRegionId, zone: undefined, city: undefined }));
        const zones = adminRegionId ? await geoService.getZones(adminRegionId) : [];
        setOptions(prev => ({ ...prev, zones, cities: [] }));
    };

    const handleZoneChange = async (zoneId: string) => {
        setFilters(prev => ({ ...prev, zone: zoneId, city: undefined }));
        const cities = zoneId ? await geoService.getCitiesByZone(zoneId) : [];
        setOptions(prev => ({...prev, cities}));
    };

    const handleCityChange = (cityId: string | undefined) => {
        setFilters(prev => ({ ...prev, city: cityId }));
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
        setIsLoading(true);
        const queryStatus = tabToStatusMap[activeTab];
        if (!queryStatus) {
            setRequests([]);
            setIsLoading(false);
            return;
        }

        try {
            const { data, count, manifest: sponsorManifest } = await sponsorService.getSponsorsPaginated(
                page,
                pageSize,
                queryStatus,
                appliedFilters,
                sortConfig,
                searchTerm
            );
            
            setRequests(data || []);
            setTotalItems(count || 0);
            if (sponsorManifest) {
                setManifest(sponsorManifest);
            }

        } catch (error) {
            console.error("Errore nel recuperare gli sponsor:", error);
            setRequests([]);
            setTotalItems(0);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, page, pageSize, appliedFilters, sortConfig, searchTerm]);

    const fetchStats = useCallback(async () => {
       const statsData = await sponsorService.getSponsorStats(appliedFilters);
       setStats(statsData);
    }, [appliedFilters]);

    const refreshData = useCallback(() => {
        fetchData();
        fetchStats();
    }, [fetchData, fetchStats]);

    useEffect(() => {
        fetchGeoOptions();
    }, [fetchGeoOptions]);
    
    // --- MODIFICA ---
    // 1. useEffect per il FETCH dei dati.
    // Si attiva al mount e quando i parametri di paginazione o i filtri incapsulati cambiano.
    useEffect(() => {
        refreshData();
    }, [page, pageSize, sortConfig, appliedFilters, searchTerm, activeTab]);

    // 2. useEffect per il RESET della pagina.
    // Si attiva SOLO quando i filtri principali cambiano (tab, ricerca, etc).
    // NON richiama il fetch, ma scatena l'useEffect precedente cambiando `page`.
    useEffect(() => {
        if (page !== 1) {
            setPage(1);
        }
    }, [activeTab, appliedFilters, searchTerm]);
    // --- FINE MODIFICA ---

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