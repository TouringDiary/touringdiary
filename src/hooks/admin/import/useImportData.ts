
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
    getStagingPois, 
    getStagingStats, 
    getDistinctRawCategories 
} from '../../../services/stagingService';
import { DatabasePoiStaging } from '../../../types/database';

export const useImportData = () => {
    // --- DATA STATE ---
    const [selectedCityId, setSelectedCityId] = useState<string>('');
    const [items, setItems] = useState<DatabasePoiStaging[]>([]);
    const [stats, setStats] = useState({ new: 0, ready: 0, imported: 0, discarded: 0 });
    const [availableRawCats, setAvailableRawCats] = useState<string[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // --- FILTERS STATE ---
    const [statusFilter, setStatusFilter] = useState<'new' | 'ready' | 'imported' | 'discarded' | 'all'>('new');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAiRating, setFilterAiRating] = useState<string[]>([]);
    const [filterRawCategories, setFilterRawCategories] = useState<string[]>([]); 
    
    // --- PAGINATION & SORT STATE ---
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50); 
    const [sortKey, setSortKey] = useState<string>('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // --- FETCHING LOGIC ---
    const refreshData = useCallback(async () => {
        if (!selectedCityId) return;
        
        setIsLoading(true);
        try {
            const [list, statistics, rawCats] = await Promise.all([
                getStagingPois({ 
                    cityId: selectedCityId, 
                    status: statusFilter, 
                    search: searchTerm, 
                    page, 
                    pageSize,
                    aiRating: filterAiRating,
                    rawCategories: filterRawCategories,
                    sortBy: sortKey,
                    sortDir: sortDir
                }),
                getStagingStats(selectedCityId),
                getDistinctRawCategories(selectedCityId)
            ]);
            
            if (isMounted.current) {
                setItems(list.data);
                setTotalItems(list.count);
                setStats(statistics);
                setAvailableRawCats(rawCats);
            }
        } catch (e) {
            console.error("Error fetching import data", e);
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    }, [selectedCityId, statusFilter, searchTerm, page, pageSize, filterAiRating, filterRawCategories, sortKey, sortDir]);

    // Initial Load & Refresh on Filter Change
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // --- SETTERS WRAPPERS (Auto-Page Reset) ---
    const handleSetSelectedCityId = (id: string) => { setSelectedCityId(id); setPage(1); };
    const handleSetStatusFilter = (status: any) => { setStatusFilter(status); setPage(1); };
    const handleSetSearchTerm = (term: string) => { setSearchTerm(term); setPage(1); };
    const handleSetFilterAiRating = (ratings: string[]) => { setFilterAiRating(ratings); setPage(1); };
    const handleSetFilterRawCategories = (cats: string[]) => { setFilterRawCategories(cats); setPage(1); };
    
    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    return {
        // Data
        items,
        stats,
        totalItems,
        availableRawCats,
        grandTotal: stats.new + stats.ready + stats.imported + stats.discarded,
        isLoading,

        // Filters State
        selectedCityId,
        statusFilter,
        searchTerm,
        filterAiRating,
        filterRawCategories,
        page,
        pageSize,
        sortKey,
        sortDir,

        // Setters
        setSelectedCityId: handleSetSelectedCityId,
        setStatusFilter: handleSetStatusFilter,
        setSearchTerm: handleSetSearchTerm,
        setFilterAiRating: handleSetFilterAiRating,
        setFilterRawCategories: handleSetFilterRawCategories,
        setPage,
        handleSort,
        
        // Action
        refreshData
    };
};
