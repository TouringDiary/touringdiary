
import { useState, useEffect, useCallback } from 'react';
import { getFullManifestAsync } from '../services/cityService';
import { CitySummary } from '../types/index';
import { useSponsorData } from './admin/useSponsorData';
import { useSponsorStats } from './admin/useSponsorStats';

/**
 * useSponsorLogic - THE BRAIN
 * Gestisce ESCLUSIVAMENTE la lettura dei dati, i filtri e lo stato della visualizzazione.
 * Non esegue scritture o mutazioni dirette.
 */
export const useSponsorLogic = () => {
    const [manifest, setManifest] = useState<CitySummary[]>([]);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'pending' | 'waiting' | 'approved' | 'rejected' | 'cancelled'>('dashboard');
    const [isManifestLoading, setIsManifestLoading] = useState(true);

    // 1. Initial Manifest Load (Una tantum)
    useEffect(() => { 
        setIsManifestLoading(true);
        getFullManifestAsync()
            .then(data => {
                setManifest(data);
                setIsManifestLoading(false);
            })
            .catch(err => {
                console.error("Critical: Failed to load city manifest for sponsors", err);
                setIsManifestLoading(false);
            });
    }, []);

    // 2. Init Sub-Hooks (Delegated Logic)
    const dataLogic = useSponsorData(activeTab, manifest);
    const statsLogic = useSponsorStats();

    // 3. Centralized Refresh (Atomic)
    // Ricarica sia le statistiche (header) che i dati della tabella corrente.
    const refreshData = useCallback(async () => {
        try {
            await Promise.all([
                dataLogic.fetchData(),
                statsLogic.fetchStats(activeTab === 'dashboard')
            ]);
        } catch (e) {
            console.error("Refresh cycle failed", e);
        }
    }, [activeTab, dataLogic.fetchData, statsLogic.fetchStats]);

    // 4. Auto-Refresh on Context Change
    // Se cambiano i filtri o la tab, ricarica i dati pertinenti.
    useEffect(() => {
        // Debounce opzionale se la ricerca è rapida, ma per ora diretto per reattività
        refreshData();
    }, [
        activeTab, 
        dataLogic.page, 
        dataLogic.pageSize, // Aggiunto per gestire cambio righe per pagina
        dataLogic.searchTerm, 
        dataLogic.filters.city, 
        dataLogic.filters.tier,
        dataLogic.filters.onlyUnread, // Aggiunto trigger su filtro non letti
        dataLogic.sortConfig.key,     // Aggiunto trigger su ordinamento
        dataLogic.sortConfig.direction
    ]);

    // 5. Data Combination for Dashboard
    // Se siamo nella dashboard, i dati "requests" devono essere quelli aggregati (per la matrice).
    // Se siamo in una tab specifica, sono quelli paginati della tabella.
    const effectiveRequests = activeTab === 'dashboard' ? statsLogic.dashboardRequests : dataLogic.requests;
    const effectiveLoading = isManifestLoading || (activeTab === 'dashboard' ? statsLogic.loadingStats : dataLogic.isLoading);

    return {
        // Data Source
        requests: effectiveRequests,
        manifest,
        stats: statsLogic.stats,
        
        // UI State
        activeTab, 
        setActiveTab,
        isLoading: effectiveLoading,

        // Filters & Pagination (Delegated to dataLogic but exposed here)
        ...dataLogic,
        
        // Actions
        refreshData
    };
};
