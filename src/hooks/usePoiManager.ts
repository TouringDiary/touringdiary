
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PointOfInterest, User } from '../types/index';
import { getPoisPaginated, getPoisByCityId } from '../services/cityService';
import { usePoiFilters } from './admin/usePoiFilters';
import { usePoiActions } from './admin/usePoiActions';

export const usePoiManager = (cityId: string, cityName: string) => {
    // 1. FILTER & STATE MANAGEMENT (Internal Hook)
    const filters = usePoiFilters();
    
    // 2. DATA STATE
    const [pois, setPois] = useState<PointOfInterest[]>([]);
    const [allCityPois, setAllCityPois] = useState<PointOfInterest[]>([]); 
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    
    // 3. SELECTION STATE
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    // 4. AUX STATE (AI & Reporting)
    const [aiRequests, setAiRequests] = useState<Record<string, number>>({});

    // --- DATA LOADING ---

    // Load full stats (per contatori e date)
    const loadStats = useCallback(async () => {
        if (!cityId) return;
        try {
            const all = await getPoisByCityId(cityId);
            setAllCityPois(all);
        } catch(e) {
            console.error("Error loading stats POIs", e);
        }
    }, [cityId]);

    // Load paginated table data
    const loadPois = useCallback(async () => {
        if (!cityId) return;
        setIsLoading(true);
        try {
            const result = await getPoisPaginated({
                cityId, 
                page: filters.page, 
                pageSize: filters.pageSize, 
                status: filters.viewStatus,
                category: filters.activeCategory === 'all' ? undefined : filters.activeCategory,
                subCategory: filters.filterSubCategory.length > 0 ? filters.filterSubCategory : undefined, 
                minRating: filters.filterRating || undefined,
                reliability: filters.filterReliability.length > 0 ? filters.filterReliability : undefined,
                interest: filters.filterInterest.length > 0 ? filters.filterInterest : undefined,
                createdDates: filters.filterCreatedDates.length > 0 ? filters.filterCreatedDates : undefined,
                updatedDates: filters.filterUpdatedDates.length > 0 ? filters.filterUpdatedDates : undefined,
                priceLevel: filters.filterPriceLevel && filters.filterPriceLevel.length > 0 ? filters.filterPriceLevel : undefined,
                search: filters.searchTerm,
                sortBy: filters.sortBy, 
                sortDir: filters.sortDir
            });
            setPois(result.data);
            setTotalItems(result.count);
        } catch (e: any) { 
            console.error("Errore caricamento POI:", e);
        } 
        finally { setIsLoading(false); }
    }, [
        cityId, filters.page, filters.pageSize, filters.viewStatus, filters.activeCategory, 
        filters.filterSubCategory, filters.filterRating, filters.filterReliability, 
        filters.filterInterest, filters.filterCreatedDates, filters.filterUpdatedDates, filters.filterPriceLevel,
        filters.searchTerm, filters.sortBy, filters.sortDir
    ]);

    // Refresh function for actions
    const refreshData = useCallback(async () => {
        await Promise.all([loadStats(), loadPois()]);
    }, [loadStats, loadPois]);

    // Initial Load & Effect on Filter Change
    useEffect(() => { 
        loadStats(); 
        loadPois(); 
    }, [loadStats, loadPois]);

    // 5. ACTIONS HOOK (Needs refreshData & selectedIds)
    // Questo hook contiene TUTTE le logiche di scrittura (save, delete, deep scan)
    const actions = usePoiActions({
        cityId,
        refreshData,
        selectedIds,
        setSelectedIds
    });

    // --- COMPUTED VALUES ---
    
    // Date uniche per filtri
    const availableDates = useMemo(() => {
        const createdSet = new Set<string>();
        const updatedSet = new Set<string>();

        if (allCityPois.length > 0) {
            allCityPois.forEach(p => {
                if (p.createdAt) try { createdSet.add(p.createdAt.split('T')[0]); } catch(e) {}
                if (p.updatedAt) try { updatedSet.add(p.updatedAt.split('T')[0]); } catch(e) {}
            });
        }
        const sorter = (a: string, b: string) => b.localeCompare(a);
        return {
            created: Array.from(createdSet).sort(sorter),
            updated: Array.from(updatedSet).sort(sorter)
        };
    }, [allCityPois]);

    // Counters helpers (Stable references)
    const getCategoryCountInternal = useCallback((catId: string, status?: 'published' | 'draft' | 'needs_check') => { 
        const currentStatus = status || filters.viewStatus;
        return allCityPois.filter(p => {
            const catMatch = catId === 'all' || p.category === catId;
            const itemStatus = p.status || 'published';
            const statusMatch = currentStatus === 'all' || itemStatus === currentStatus;
            return catMatch && statusMatch;
        }).length;
    }, [allCityPois, filters.viewStatus]);

    const getTotalCategoryCountInternal = useCallback((catId: string) => {
        if (catId === 'all') return allCityPois.length;
        return allCityPois.filter(p => p.category === catId).length;
    }, [allCityPois]);

    // --- HANDLERS WRAPPERS (ALL WRAPPED IN CALLBACK) ---

    const toggleSelection = useCallback((id: string) => { 
        const newSet = new Set(selectedIds); 
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id); 
        setSelectedIds(newSet); 
    }, [selectedIds]);
    
    const toggleAllPage = useCallback(() => { 
        const allOnPage = pois.map(p => p.id); 
        const allSelected = allOnPage.every(id => selectedIds.has(id)); 
        const newSet = new Set(selectedIds); 
        if (allSelected) { allOnPage.forEach(id => newSet.delete(id)); } 
        else { allOnPage.forEach(id => newSet.add(id)); } 
        setSelectedIds(newSet); 
    }, [pois, selectedIds]);

    const resetFiltersAndReload = useCallback(() => {
        filters.resetFilters();
        setSelectedIds(new Set());
    }, [filters]);
    
    const resetSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const setViewStatusWrapper = useCallback((s: any) => { 
        filters.setViewStatus(s); 
        setSelectedIds(new Set()); 
    }, [filters]);

    const handleAiInputChange = useCallback((cat: string, val: string) => { 
        const num = parseInt(val); 
        setAiRequests(prev => ({ ...prev, [cat]: isNaN(num) || num < 0 ? 0 : num })); 
    }, []);

    // Wrapper per Bulk Status che trova i POI completi
    const handleBulkStatusChange = useCallback((status: 'published' | 'draft', currentUser?: User) => {
        const finder = (id: string) => pois.find(p => p.id === id) || allCityPois.find(p => p.id === id);
        actions.bulkStatusChange(status, finder, currentUser);
    }, [pois, allCityPois, actions]);

    // Wrapper per Bulk Reset Images
    const handleBulkResetImages = useCallback((currentUser?: User) => {
        const finder = (id: string) => pois.find(p => p.id === id) || allCityPois.find(p => p.id === id);
        actions.bulkResetImages(finder, currentUser);
    }, [pois, allCityPois, actions]);

    return {
        state: { 
            pois, 
            allCityPois, 
            totalItems, 
            isLoading, 
            isSaving: actions.isSaving, 
            isDeleting: actions.isDeleting, 
            isFixingTaxonomy: actions.isFixingTaxonomy, 
            isBulkProcessing: actions.isBulkProcessing, 
            
            // From Filters
            page: filters.page, 
            pageSize: filters.pageSize, 
            viewStatus: filters.viewStatus, 
            activeCategory: filters.activeCategory, 
            filterSubCategory: filters.filterSubCategory, 
            filterRating: filters.filterRating, 
            filterReliability: filters.filterReliability, 
            filterInterest: filters.filterInterest, 
            filterCreatedDates: filters.filterCreatedDates, 
            filterUpdatedDates: filters.filterUpdatedDates,
            filterPriceLevel: filters.filterPriceLevel, 
            searchTerm: filters.searchTerm, 
            sortBy: filters.sortBy, 
            sortDir: filters.sortDir, 
            
            selectedIds, 
            aiRequests, 
            genStatus: actions.genStatus, 
            availableDates
        },
        actions: { 
            // Filter Actions
            setPage: filters.setPage, 
            setPageSize: filters.setPageSize, 
            setViewStatus: setViewStatusWrapper, 
            setCategory: filters.setCategory, 
            setSearch: filters.setSearch, 
            setFilterSubCategory: filters.setFilterSubCategory, 
            setFilterRating: filters.setFilterRating, 
            setFilterReliability: filters.setFilterReliability, 
            setFilterInterest: filters.setFilterInterest, 
            setFilterCreatedDates: filters.setFilterCreatedDates, 
            setFilterUpdatedDates: filters.setFilterUpdatedDates,
            setFilterPriceLevel: filters.setFilterPriceLevel, 
            toggleSort: filters.toggleSort, 
            setSortBy: filters.setSortBy, 
            resetFiltersAndReload,
            
            // Selection Actions
            toggleSelection, 
            toggleAllPage, 
            resetSelection, 
            
            // CRUD Actions (Proxied from usePoiActions)
            savePoi: actions.savePoi, 
            deletePoi: actions.deletePoi, 
            bulkDelete: actions.bulkDelete, 
            bulkStatusChange: handleBulkStatusChange, 
            bulkResetImages: handleBulkResetImages, 
            fixTaxonomy: actions.fixTaxonomy,
            
            // Deep Scan Logic
            stopBulkProcess: actions.stopBulkProcess,
            executeDailyDeepScan: actions.executeDailyDeepScan, // EXPLICITLY EXPORTED
            
            // Helper Actions
            handleAiInputChange,
            refreshData
        },
        counts: { 
            getCategoryCount: getCategoryCountInternal, 
            getTotalCategoryCount: getTotalCategoryCountInternal
        }
    };
};
