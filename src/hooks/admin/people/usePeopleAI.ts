
import React, { useState } from 'react';
import { FamousPerson, User } from '../../../types/index';
import { saveCityPerson } from '../../../services/cityService';
import { suggestCityPeople, enrichPersonData } from '../../../services/ai';
import { generateHistoricalPortrait } from '../../../services/ai/aiVision';
import { findExistingPortrait } from '../../../services/mediaService'; 
import { incrementAiUsage } from '../../../services/aiUsageService';
import { useCityEditor } from '@/context/CityEditorContext';

interface UsePeopleAIProps {
    cityId: string;
    cityName: string;
    peopleList: FamousPerson[];
    setPeopleList: React.Dispatch<React.SetStateAction<FamousPerson[]>>;
    reloadList: () => Promise<void>;
    selectedIds: Set<string>;
    resetSelection: () => void;
    mapDbToApp: (dbObj: any) => FamousPerson;
}

export const usePeopleAI = ({ 
    cityId, cityName, peopleList, setPeopleList, reloadList, selectedIds, resetSelection, mapDbToApp 
}: UsePeopleAIProps) => {
    
    const { reloadCurrentCity } = useCityEditor();

    // --- AI STATE ---
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [discoveryResults, setDiscoveryResults] = useState<any[]>([]);

    // 1. DISCOVERY 
    const runDiscovery = async (query: string, count: number) => {
        setIsDiscovering(true);
        try {
            // Track: 1 chiamata per il suggerimento lista
            const existingNames = peopleList.map(p => p.name);
            const results = await suggestCityPeople(cityName, existingNames, query, count);
            setDiscoveryResults(results);
        } catch (e) {
            console.error(e);
        } finally {
            setIsDiscovering(false);
        }
    };

    const importDiscoveryPerson = async (person: any) => {
        setDiscoveryResults(prev => prev.map(p => p.name === person.name ? { ...p, isImporting: true } : p));
        try {
            let finalImageUrl = await findExistingPortrait(person.name);
            if (!finalImageUrl) {
                // Generazione immagine consuma 1 API call
                finalImageUrl = await generateHistoricalPortrait(person.name, person.role, cityName);
            }
            const newPerson = {
                ...person,
                imageUrl: finalImageUrl || 'https://images.unsplash.com/photo-1555626040-3b731de3a81c?q=80&w=400',
                status: 'draft',
                orderIndex: peopleList.length + 1,
                lifespan: person.lifespan || '', quote: person.quote || '', famousWorks: person.famousWorks || [], 
                relatedPlaces: person.relatedPlaces || [], fullBio: person.fullBio || person.bio || '', 
                privateLife: person.privateLife || '', collaborations: person.collaborations || [], 
                awards: person.awards || [], careerStats: person.careerStats || []
            };
            const saved = await saveCityPerson(cityId, newPerson);
            if (saved) {
                const mapped = mapDbToApp(saved);
                setPeopleList(prev => [...prev, mapped]);
                setDiscoveryResults(prev => prev.filter(p => p.name !== person.name));
                reloadCurrentCity();
            }
        } catch (e) {
            setDiscoveryResults(prev => prev.map(p => p.name === person.name ? { ...p, isImporting: false } : p));
        }
    };
    
    const removeDiscoveryResult = (name: string) => {
        setDiscoveryResults(prev => prev.filter(p => p.name !== name));
    };

    // 2. MAGIC FIX (Wipe & Rewrite Single)
    const wipeAndRewritePerson = async (person: FamousPerson, user?: User) => {
        if (!person.id) return;
        if (!isBulkProcessing) setProcessingId(person.id); 
        
        try {
            // Track Usage (Single Call per Enrichment)
            if (user && !isBulkProcessing) {
                await incrementAiUsage(user, 1);
            }

            const enrichedData = await enrichPersonData(person.name, cityName);
            
            if (enrichedData) {
                let finalImageUrl = person.imageUrl;
                const recoveredUrl = await findExistingPortrait(person.name);
                
                if (recoveredUrl) {
                    finalImageUrl = recoveredUrl;
                } else {
                    const isMissing = !finalImageUrl || finalImageUrl.trim() === '';
                    const isPlaceholder = finalImageUrl.includes('unsplash.com') || finalImageUrl.includes('ui-avatars');
                    if (isMissing || isPlaceholder) {
                        const roleForImg = enrichedData.role || person.role || 'Personaggio Storico';
                        // Generazione Immagine: +1 Chiamata
                        const newImage = await generateHistoricalPortrait(person.name, roleForImg, cityName);
                        if (newImage) {
                            finalImageUrl = newImage;
                            if (user && !isBulkProcessing) await incrementAiUsage(user, 1);
                        }
                    }
                }

                const updatedPerson: FamousPerson = { ...person, ...enrichedData, imageUrl: finalImageUrl, role: enrichedData.role || person.role || 'Personaggio Storico', bio: enrichedData.bio || person.bio, status: 'draft' };
                await saveCityPerson(cityId, updatedPerson);
                setPeopleList(prev => prev.map(p => p.id === person.id ? updatedPerson : p));
                
                return { success: true };
            } else {
                throw new Error("L'AI non ha restituito dati validi.");
            }
        } catch (e: any) {
            console.error(`Errore Wipe & Rewrite per ${person.name}:`, e);
            return { success: false, error: e.message };
        } finally {
            if (!isBulkProcessing) setProcessingId(null); 
        }
    };

    // 3. IMAGE GENERATION (Standalone)
    const regeneratePortrait = async (person: FamousPerson) => {
        if (!person.id) return;
        setProcessingId(person.id);
        try {
            const newImageUrl = await generateHistoricalPortrait(person.name, person.role, cityName);
            if (newImageUrl) {
                const updated = { ...person, imageUrl: newImageUrl };
                await saveCityPerson(cityId, updated);
                setPeopleList(prev => prev.map(p => p.id === person.id ? updated : p));
                return true;
            }
        } catch (e) {
            console.error("Errore generazione ritratto:", e);
        } finally {
            setProcessingId(null);
        }
        return false;
    };

    // 4. BATCH PROCESSING (Bulk Fix) - THROTTLED
    const fixPeopleBatch = async (user?: User) => {
        const targets = selectedIds.size > 0 ? peopleList.filter(p => p.id && selectedIds.has(p.id)) : peopleList;
        if (targets.length === 0) return;
        
        setIsBulkProcessing(true);

        // TRACK USAGE MASSIVO
        // Qui incrementiamo per ogni persona, perché il ciclo fa una chiamata per persona.
        if (user) await incrementAiUsage(user, targets.length);
        
        for (const person of targets) {
            if (person.id) {
                // Scroll per feedback visivo
                const el = document.getElementById(`person-card-${person.id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

                setProcessingId(person.id);
                try {
                    // Passiamo null come user per evitare che incrementi ancora dentro
                    await wipeAndRewritePerson(person, undefined); 
                } catch (e) {
                    console.error(`Errore durante fix massivo su ${person.name}`, e);
                }
                
                // --- CRITICO: THROTTLING 5 SECONDI ---
                // Evita Rate Limit 429 di Google Gemini
                await new Promise(r => setTimeout(r, 5000));
            }
        }
        
        setProcessingId(null);
        setIsBulkProcessing(false);
        if (selectedIds.size > 0) resetSelection();

        await reloadCurrentCity();
        return { success: true, count: targets.length };
    };

    const bulkUpdateStatus = async (status: 'published' | 'draft') => {
        if (selectedIds.size === 0) return;
        setIsBulkProcessing(true);
        try {
            setPeopleList(prev => prev.map(p => selectedIds.has(p.id!) ? { ...p, status } : p));
            const promises = Array.from(selectedIds).map(id => {
                const person = peopleList.find(p => p.id === id);
                if (person) return saveCityPerson(cityId, { ...person, status });
                return Promise.resolve();
            });
            await Promise.all(promises);
            await reloadCurrentCity();
            resetSelection();
        } catch (e) {
            reloadList();
        } finally {
            setIsBulkProcessing(false);
        }
    };

    return {
        processingId, isDiscovering, isBulkProcessing, discoveryResults,
        runDiscovery, importDiscoveryPerson, removeDiscoveryResult,
        wipeAndRewritePerson, regeneratePortrait, fixPeopleBatch, bulkUpdateStatus
    };
};
