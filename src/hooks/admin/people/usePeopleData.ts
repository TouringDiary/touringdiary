
import { useState, useEffect, useCallback } from 'react';
import { FamousPerson } from '../../../types/index';
import { getCityPeople, saveCityPerson, deleteCityPerson } from '../../../services/cityService';
import { useCityEditor } from '@/context/CityEditorContext';

export const usePeopleData = (cityId: string) => {
    const { reloadCurrentCity } = useCityEditor();

    // --- DATA STATE ---
    const [peopleList, setPeopleList] = useState<FamousPerson[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // --- SELECTION STATE ---
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    // --- ACTION STATES ---
    const [isDeleting, setIsDeleting] = useState(false);

    // 1. LOAD DATA
    const loadPeople = useCallback(async () => {
        if (!cityId) return;
        setIsLoading(true);
        try {
            const data = await getCityPeople(cityId);
            const sorted = data.sort((a,b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            setPeopleList(sorted);
        } catch (e) {
            console.error("Error loading people", e);
        } finally {
            setIsLoading(false);
        }
    }, [cityId]);

    useEffect(() => {
        loadPeople();
    }, [loadPeople]);

    // 2. SELECTION LOGIC
    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleAll = () => {
        if (selectedIds.size === peopleList.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(peopleList.map(p => p.id!)));
        }
    };

    const resetSelection = () => {
        setSelectedIds(new Set());
    };

    // 3. CRUD OPERATIONS
    
    // Add Placeholder
    const addManualPerson = async () => {
        const tempPerson: any = {
             name: 'Nuovo Personaggio', role: 'Artista', bio: '', 
             imageUrl: 'https://images.unsplash.com/photo-1555626040-3b731de3a81c?q=80&w=400', 
             relatedPlaces: [], famousWorks: [], fullBio: '', privateLife: '', awards: [], 
             collaborations: [], careerStats: [], status: 'draft', orderIndex: peopleList.length + 1
        };
        const saved = await saveCityPerson(cityId, tempPerson);
        if(saved) {
             const mappedSaved = mapDbToApp(saved);
             setPeopleList(prev => [...prev, mappedSaved]);
             return mappedSaved.id;
        }
        return null;
    };

    // Delete Single
    const deletePerson = async (id: string) => {
        setIsDeleting(true);
        try {
            await deleteCityPerson(id);
            setPeopleList(prev => prev.filter(p => p.id !== id));
            reloadCurrentCity();
            // Clean selection if deleted
            if (selectedIds.has(id)) toggleSelection(id);
            return true;
        } catch (e) {
            return false;
        } finally {
            setIsDeleting(false);
        }
    };

    // Local Update (Optimistic input)
    const updatePersonLocal = (id: string, field: keyof FamousPerson, value: any) => {
        setPeopleList(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    // Save Changes (DB)
    const savePersonChanges = async (person: FamousPerson) => {
        try {
            await saveCityPerson(cityId, person);
            reloadCurrentCity();
            return true;
        } catch (e) {
            return false;
        }
    };

    // Toggle Status (Published/Draft)
    const toggleStatus = async (person: FamousPerson) => {
        const newStatus: 'published' | 'draft' = person.status === 'published' ? 'draft' : 'published';
        const updated: FamousPerson = { ...person, status: newStatus };
        
        // Optimistic
        setPeopleList(prev => prev.map(p => p.id === person.id ? updated : p));
        
        await saveCityPerson(cityId, updated);
        reloadCurrentCity();
    };

    // Reorder
    const reorderPerson = async (id: string, newRank: number) => {
        if (isNaN(newRank) || newRank < 1) return;
        const index = newRank - 1;
        const currentList = [...peopleList];
        const itemIndex = currentList.findIndex(p => p.id === id);
        
        if (itemIndex === -1 || index >= currentList.length) return;

        const [item] = currentList.splice(itemIndex, 1);
        currentList.splice(index, 0, item);

        const updatedList = currentList.map((p, idx) => ({ ...p, orderIndex: idx + 1 }));
        setPeopleList(updatedList);

        for (const p of updatedList) {
             await saveCityPerson(cityId, p);
        }
    };

    // Helper Mapping
    const mapDbToApp = (saved: any): FamousPerson => ({
        id: saved.id, name: saved.name, role: saved.role, bio: saved.bio, imageUrl: saved.image_url,
        fullBio: saved.full_bio, quote: saved.quote, lifespan: saved.lifespan, status: saved.status,
        orderIndex: saved.order_index
    });

    return {
        peopleList,
        setPeopleList, // Exposed for AI Hook updates
        isLoading,
        selectedIds,
        isDeleting,
        
        toggleSelection,
        toggleAll,
        resetSelection,
        
        addManualPerson,
        deletePerson,
        updatePersonLocal,
        savePersonChanges,
        toggleStatus,
        reorderPerson,
        reloadList: loadPeople,
        
        mapDbToApp // Exposed helper
    };
};
