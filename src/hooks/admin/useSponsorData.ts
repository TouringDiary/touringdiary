
import { useState, useMemo, useCallback } from 'react';
import { getSponsorsPaginated } from '../../services/sponsorService';
import { SponsorRequest, CitySummary } from '../../types/index';

export const useSponsorData = (activeTab: string, initialManifest: CitySummary[]) => {
    // Data State
    const [requests, setRequests] = useState<SponsorRequest[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Filters State
    const [filterContinent, setFilterContinent] = useState('Europa');
    const [filterNation, setFilterNation] = useState('Italia');
    const [filterAdminRegion, setFilterAdminRegion] = useState('Campania');
    const [filterZone, setFilterZone] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [filterTier, setFilterTier] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [onlyUnread, setOnlyUnread] = useState(false);
    
    // Sort State
    const [sortConfig, setSortConfig] = useState<{
        key: 'date' | 'lastModified' | 'endDate';
        direction: 'asc' | 'desc';
    }>({ key: 'date', direction: 'desc' });

    // --- FETCHING LOGIC ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'dashboard') {
                setRequests([]);
                setTotalItems(0);
            } else {
                // Se c'è un filtro Zona ma non Città, dobbiamo fare un filtro post-query o recuperare più dati
                // Per semplicità e performance admin, se c'è un filtro zona, recuperiamo senza paginazione server-side stretta su città
                // e filtriamo.
                
                const result = await getSponsorsPaginated({
                    page,
                    pageSize: (filterZone && !filterCity) ? 1000 : pageSize, // Aumenta limit se filtriamo per zona
                    status: activeTab,
                    cityId: filterCity || undefined,
                    tier: filterTier || undefined,
                    search: searchTerm,
                    onlyUnread,
                    sortBy: sortConfig.key,
                    sortDir: sortConfig.direction
                });
                
                let data = result.data;
                
                // Filtro Client-Side per Zona/Regione se la città non è specificata
                if (!filterCity && (filterZone || filterAdminRegion)) {
                    data = data.filter(req => {
                        const city = initialManifest.find(c => c.id === req.cityId);
                        
                        // FIX CRITICO: Se la città non viene trovata (es. ID vecchio o città cancellata), 
                        // includi comunque la riga per permettere all'admin di vederla e correggerla/eliminarla.
                        // Non nascondere i dati orfani!
                        if (!city) return true; 
                        
                        if (filterZone && city.zone !== filterZone) return false;
                        if (filterAdminRegion && city.adminRegion !== filterAdminRegion) return false;
                        return true;
                    });
                }

                setRequests(data);
                // Aggiorna total count solo se non abbiamo filtrato client-side, altrimenti usa length
                setTotalItems((!filterCity && (filterZone || filterAdminRegion)) ? data.length : result.count);
            }
        } catch (e) {
            console.error("List fetch error:", e);
        } finally {
            setIsLoading(false);
        }
    }, [page, pageSize, activeTab, filterCity, filterZone, filterAdminRegion, filterTier, searchTerm, onlyUnread, sortConfig, initialManifest]);

    // --- FILTER HANDLERS ---
    const handleContinentChange = (val: string) => { setFilterContinent(val); setFilterNation(''); setFilterAdminRegion(''); setFilterZone(''); setFilterCity(''); setPage(1); };
    const handleNationChange = (val: string) => { setFilterNation(val); setFilterAdminRegion('Campania'); setFilterZone(''); setFilterCity(''); setPage(1); };
    const handleAdminRegionChange = (val: string) => { setFilterAdminRegion(val); setFilterZone(''); setFilterCity(''); setPage(1); };
    
    // Fix: Quando cambia la zona, resetta la città ma mantieni la zona nello stato per il filtro
    const handleZoneChange = (val: string) => { setFilterZone(val); setFilterCity(''); setPage(1); };
    
    const handleCityChange = (val: string) => { setFilterCity(val); setPage(1); };
    const handleTierChange = (val: string) => { setFilterTier(val); setPage(1); };
    const handlePageChange = (newPage: number) => setPage(newPage);

    // --- OPTIONS MEMOIZATION ---
    const options = useMemo(() => {
        // Filtra le città in base alla zona selezionata
        let filteredCities = initialManifest;
        if (filterZone) {
            filteredCities = initialManifest.filter(c => c.zone === filterZone);
        } else if (filterAdminRegion) {
            filteredCities = initialManifest.filter(c => c.adminRegion === filterAdminRegion);
        }

        return {
            continents: Array.from(new Set(initialManifest.map(c => c.continent || 'Europa'))).sort(),
            nations: Array.from(new Set(initialManifest.map(c => c.nation || 'Italia'))).sort(),
            adminRegions: ['Campania'],
            zones: Array.from(new Set(initialManifest.map(c => c.zone))).sort(),
            cities: filteredCities.sort((a,b) => a.name.localeCompare(b.name))
        };
    }, [initialManifest, filterZone, filterAdminRegion]);

    return {
        requests,
        page, pageSize, totalItems, isLoading,
        filters: { continent: filterContinent, nation: filterNation, adminRegion: filterAdminRegion, zone: filterZone, city: filterCity, tier: filterTier, onlyUnread },
        searchTerm, setSearchTerm, setOnlyUnread,
        sortConfig, setSortConfig, setPageSize,
        
        handleContinentChange, handleNationChange, handleAdminRegionChange, 
        handleZoneChange, handleCityChange, handleTierChange, handlePageChange,
        
        options,
        fetchData
    };
};
