
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAdminData } from './useAdminData';
import { usePagination } from './usePagination';
import { deleteCity, getFullManifestAsync } from '../services/cityService';

export const useCityList = () => {
    const { cities: localCities } = useAdminData(); 
    const [cloudCities, setCloudCities] = useState<any[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    
    // Filters & Sorting
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<string>('updatedAt'); 
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [pageInput, setPageInput] = useState('1');
    const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Force reload logic
    const forceReload = useCallback(async () => {
        setIsInitialLoading(true);
        try {
            const data = await getFullManifestAsync();
            setCloudCities(data);
        } catch (e) {
            console.error("Errore ricaricamento lista:", e);
        } finally {
            setIsInitialLoading(false);
        }
    }, []);

    // Initial load & Event Listener
    useEffect(() => {
        forceReload();
        
        const handleRefresh = () => forceReload();
        window.addEventListener('refresh-city-list', handleRefresh);
        return () => window.removeEventListener('refresh-city-list', handleRefresh);
    }, [forceReload]);

    // Derived Data
    const effectiveCities = cloudCities.length > 0 ? cloudCities : localCities;

    const filteredCities = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return effectiveCities.filter(c => 
            c.name.toLowerCase().includes(lower) || c.zone.toLowerCase().includes(lower)
        ).sort((a, b) => {
            let valA = (a as any)[sortKey];
            let valB = (b as any)[sortKey];

            if (sortKey === 'createdAt' || sortKey === 'updatedAt' || sortKey === 'publishedAt') {
                valA = valA ? new Date(valA).getTime() : 0;
                valB = valB ? new Date(valB).getTime() : 0;
            }

            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortDir === 'asc' ? valA - valB : valB - valA;
            }
            
            const strA = String(valA || '').toLowerCase();
            const strB = String(valB || '').toLowerCase();
            return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        });
    }, [effectiveCities, searchTerm, sortKey, sortDir]);

    // Pagination Hook usage
    const pagination = usePagination(filteredCities, 15);

    // Helpers
    const handleSort = (key: string) => {
        if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); } 
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleAllPage = () => {
        const currentData = pagination.currentData;
        const allSelected = currentData.every(c => selectedIds.has(c.id));
        const newSet = new Set(selectedIds);
        if (allSelected) currentData.forEach(c => newSet.delete(c.id)); 
        else currentData.forEach(c => newSet.add(c.id)); 
        setSelectedIds(newSet);
    };

    return {
        cities: filteredCities,
        currentData: pagination.currentData,
        pagination,
        isInitialLoading,
        searchTerm, setSearchTerm,
        sortKey, sortDir, handleSort,
        pageInput, setPageInput,
        selectedIds, setSelectedIds, toggleSelection, toggleAllPage,
        forceReload,
        effectiveCities
    };
};
