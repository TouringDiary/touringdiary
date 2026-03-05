
import { useState, useCallback } from 'react';

export const usePoiFilters = () => {
    // --- PAGINATION ---
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    // --- MAIN FILTERS ---
    const [viewStatus, setViewStatus] = useState<'published' | 'draft' | 'needs_check' | 'all'>('published');
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // --- ADVANCED FILTERS ---
    const [filterSubCategory, setFilterSubCategory] = useState<string[]>([]);
    const [filterRating, setFilterRating] = useState<number>(0);
    const [filterReliability, setFilterReliability] = useState<string[]>([]);
    const [filterInterest, setFilterInterest] = useState<string[]>([]);
    const [filterCreatedDates, setFilterCreatedDates] = useState<string[]>([]);
    const [filterUpdatedDates, setFilterUpdatedDates] = useState<string[]>([]);
    const [filterPriceLevel, setFilterPriceLevel] = useState<number[]>([]); // NEW

    // --- SORTING ---
    const [sortBy, setSortBy] = useState<'name' | 'date_added' | 'updated_at'>('updated_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    // --- ACTIONS ---
    
    // Reset page on filter change
    const resetPage = useCallback(() => setPage(1), []);

    const setCategory = useCallback((cat: string) => {
        setActiveCategory(cat);
        setFilterSubCategory([]);
        setFilterRating(0);
        resetPage();
    }, [resetPage]);

    const setSearch = useCallback((term: string) => {
        setSearchTerm(term);
        // Non resettiamo la pagina qui per UX fluida durante la digitazione, 
        // ma idealmente si dovrebbe fare in un debounce
    }, []);

    const toggleSort = useCallback(() => {
        setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    }, []);

    const resetFilters = useCallback(() => {
        setSearchTerm('');
        setActiveCategory('all');
        setFilterSubCategory([]);
        setFilterRating(0);
        setFilterReliability([]);
        setFilterInterest([]);
        setFilterCreatedDates([]);
        setFilterUpdatedDates([]);
        setFilterPriceLevel([]); // NEW
        setPage(1);
        setPageSize(12);
    }, []);

    return {
        // State
        page, pageSize,
        viewStatus, activeCategory, searchTerm,
        filterSubCategory, filterRating,
        filterReliability, filterInterest,
        filterCreatedDates, filterUpdatedDates,
        filterPriceLevel, // NEW
        sortBy, sortDir,

        // Setters
        setPage, setPageSize,
        setViewStatus,
        setCategory,
        setSearch,
        setFilterSubCategory,
        setFilterRating,
        setFilterReliability,
        setFilterInterest,
        setFilterCreatedDates,
        setFilterUpdatedDates,
        setFilterPriceLevel, // NEW
        setSortBy,
        
        // Logic
        toggleSort,
        resetFilters
    };
};
