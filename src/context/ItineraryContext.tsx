
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Itinerary, ItineraryItem, PointOfInterest, PremadeItinerary, RoadbookDay } from '../types/index';
import { User } from '../types/users';
import { getPoisByIds } from '../services/cityService'; 
import { getStorageItem, setStorageItem } from '../services/storageService'; 
import { saveUserDraft, getUserDrafts, deleteUserDraft } from '../services/communityService'; 
import { useUser } from './UserContext'; 

import { ItineraryStorageManager } from '../services/itineraryStorageManager';

interface ItineraryContextType {
    itinerary: Itinerary;
    setItinerary: React.Dispatch<React.SetStateAction<Itinerary>>;
    savedProjects: Itinerary[];
    saveProject: (name?: string, user?: User, isSaveAs?: boolean) => Promise<boolean>; 
    loadProject: (project: Itinerary) => void;
    deleteProject: (id: string) => Promise<void>; 
    highlightDates: boolean;
    setHighlightDates: (v: boolean) => void;
    highlightedItemId: string | null;
    setHighlightedItemId: (id: string | null) => void;
    addItem: (item: ItineraryItem) => void;
    removeItem: (id: string) => void;
    updateDayStyle: (dayIndex: number, colorClass: string) => void;
    updateRoadbook: (data: RoadbookDay[]) => void;
    clearItinerary: () => void;
    importPremadeItinerary: (template: PremadeItinerary, startDate?: string) => Promise<void>;
    findFreeSlot: (dayIndex: number) => string | null;
    refreshItineraryData: () => Promise<void>;
    syncCloudDrafts: (userId: string) => Promise<void>; 
}

const ItineraryContext = createContext<ItineraryContextType | undefined>(undefined);

export const ItineraryProvider = ({ children }: { children?: ReactNode }) => {
    // Accesso all'utente corrente per filtrare i dati
    const userContext = useUser();
    const user = userContext?.user;
    const prevUserIdRef = useRef<string>(user?.id || 'guest');
    
    const [itinerary, setItinerary] = useState<Itinerary>({ 
        id: 'it1', name: '', startDate: null, endDate: null, items: [], createdAt: Date.now(), dayStyles: {}, roadbook: [] 
    });
    const [savedProjects, setSavedProjects] = useState<Itinerary[]>([]);
    const [highlightDates, setHighlightDates] = useState(false);
    const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

    // --- CARICAMENTO PROGETTI (CLOUD VS LOCAL) ---
    useEffect(() => {
        const loadProjects = async () => {
            const projects = await ItineraryStorageManager.loadProjects(user);
            setSavedProjects(projects);
        };

        loadProjects();
    }, [user?.id, user?.role]); 

    const clearItinerary = useCallback(() => {
        setItinerary({ id: `it-${Date.now()}`, name: '', startDate: null, endDate: null, items: [], createdAt: Date.now(), dayStyles: {}, roadbook: [] });
        setHighlightedItemId(null);
    }, []);

    // --- AUTO CLEANUP ON LOGOUT ---
    useEffect(() => {
        const prevId = prevUserIdRef.current;
        const currentId = user?.id || 'guest';
        
        if (prevId !== 'guest' && currentId === 'guest') {
            console.log("[Itinerary] User logged out. Clearing active itinerary.");
            clearItinerary();
        }
        
        prevUserIdRef.current = currentId;
    }, [user.id, clearItinerary]);

    // Sync manuale
    const syncCloudDrafts = useCallback(async (userId: string) => {
        if (!userId || userId === 'guest') return;
        try {
            const projects = await ItineraryStorageManager.loadProjects(user);
            setSavedProjects(projects);
        } catch (e) {
            console.error("Sync error:", e);
        }
    }, [user]);

    const saveProject = useCallback(async (nameOverride?: string, userObj?: User, isSaveAs?: boolean) => {
        const targetUser = userObj || user;
        const isGuest = !targetUser || targetUser.role === 'guest';
        
        const targetName = nameOverride || itinerary.name;
        if (!targetName) {
            console.warn("Inserisci un nome per il viaggio.");
            return false;
        }

        let targetId = itinerary.id;
        
        const isTempId = targetId === 'it1' || targetId.startsWith('imported-') || targetId.startsWith('ai-it-') || targetId.startsWith('draft_') || targetId.startsWith('it-');
        
        const existsInSaved = savedProjects.some(p => p.id === targetId);
        const isGhostId = !isGuest && !isTempId && !existsInSaved;

        const isSaveAsNewCopy = isSaveAs && targetName !== itinerary.name;

        if (isTempId || isGhostId || isSaveAsNewCopy) {
             console.log("[Itinerary] Generating fresh UUID for project (Temp, Ghost, or SaveAs with new name detected)");
             targetId = crypto.randomUUID();
        }
        
        const saveObject: Itinerary = { 
            ...itinerary, 
            id: targetId, 
            name: targetName, 
            userId: isGuest ? 'guest' : targetUser.id, 
            createdAt: itinerary.createdAt || Date.now() 
        };
        
        setItinerary(saveObject);
        
        try {
            const success = await ItineraryStorageManager.saveProject(saveObject, targetUser);
            
            if (success) {
                // Aggiorna OTTIMISTICO Locale
                setSavedProjects(prev => {
                    const existingIndex = prev.findIndex(p => p.id === saveObject.id);
                    if (existingIndex >= 0) {
                        const newArr = [...prev];
                        newArr[existingIndex] = saveObject;
                        return newArr;
                    }
                    return [saveObject, ...prev];
                });

                // SYNC ROBUSTO
                if (!isGuest) {
                    try {
                        const fresh = await ItineraryStorageManager.loadProjects(targetUser);
                        setSavedProjects(fresh);
                    } catch(e) {
                        console.warn("Sync post-save failed but save was successful.");
                    }
                }
                return true;
            } else {
                console.error("Errore durante il salvataggio. Riprova.");
                return false;
            }
        } catch (error) {
            console.error("Errore durante il salvataggio in cloud:", error);
            return false;
        }
    }, [itinerary, user, savedProjects]);

    const loadProject = useCallback((project: Itinerary) => setItinerary(project), []);
    
    // DELETE PROJECT
    const deleteProject = useCallback(async (targetId: string) => {
        const isGuest = !user || user.role === 'guest';
        
        if (!targetId) return;

        // Sanitizzazione ID
        const cleanId = targetId.trim();

        const success = await ItineraryStorageManager.deleteProject(cleanId, user);
        
        if (success) {
            // Aggiorna OTTIMISTICO Locale
            setSavedProjects(prev => prev.filter(p => p.id !== cleanId));
            
            // SYNC ROBUSTO
            if (!isGuest) {
                try {
                    const fresh = await ItineraryStorageManager.loadProjects(user);
                    setSavedProjects(fresh);
                } catch(e) {
                    console.warn("Sync post-delete failed but delete was successful.");
                }
            }
        } else {
            throw new Error("Errore cancellazione: ID non trovato o permessi mancanti. Verifica la connessione.");
        }

        // --- RESET ID ATTIVO SE CANCELLATO ---
        if (itinerary.id === cleanId) {
            console.log("[Itinerary] Deleted active project. Resetting ID to temp draft.");
            setItinerary(prev => ({
                ...prev,
                id: `draft_${Date.now()}` // Nuovo ID temporaneo
            }));
        }

    }, [user, itinerary.id]);

    const addItem = (item: ItineraryItem) => {
        setItinerary(prev => ({ ...prev, items: [...prev.items, item] }));
        setHighlightedItemId(item.id);
    };

    const removeItem = (id: string) => {
        setItinerary(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
    };

    const updateDayStyle = (dayIndex: number, colorClass: string) => {
        setItinerary(prev => ({ ...prev, dayStyles: { ...prev.dayStyles, [dayIndex]: colorClass } }));
    };

    const updateRoadbook = (data: RoadbookDay[]) => {
        setItinerary(prev => ({ ...prev, roadbook: data }));
    };

    const importPremadeItinerary = useCallback(async (template: PremadeItinerary, startDateOverride?: string) => {
        const newItems: ItineraryItem[] = [];
        for (const item of template.items) {
            let poi: PointOfInterest | null = null;
             poi = { 
                id: item.poiId, 
                name: item.fallbackName || 'POI', 
                category: 'discovery', 
                description: item.note || '', 
                imageUrl: '', 
                rating: 4.5, 
                votes: 0, 
                coords: { lat: 0, lng: 0 }, 
                address: '' 
            };
            
            newItems.push({ id: `premade-${Date.now()}-${Math.random()}`, cityId: template.mainCity.toLowerCase(), dayIndex: item.dayIndex, timeSlotStr: item.timeSlotStr, poi, notes: item.note });
        }
        const startD = startDateOverride || new Date().toISOString().split('T')[0];
        const start = new Date(startD);
        const end = new Date(start);
        end.setDate(start.getDate() + template.durationDays - 1);
        
        const newId = crypto.randomUUID();
        
        setItinerary({ 
            id: newId, 
            userId: user ? user.id : 'guest', 
            name: template.title, 
            startDate: startD, 
            endDate: end.toISOString().split('T')[0], 
            items: newItems, 
            createdAt: Date.now(), 
            dayStyles: {}, 
            roadbook: [] 
        });
    }, [user.id]);

    const findFreeSlot = (dayIndex: number) => {
        const dayItems = itinerary.items.filter(i => 
            i.dayIndex === dayIndex && 
            i.timeSlotStr && 
            i.timeSlotStr.includes(':')
        );
        
        if (dayItems.length === 0) return '09:00';
        
        dayItems.sort((a, b) => a.timeSlotStr.localeCompare(b.timeSlotStr));
        
        const lastItem = dayItems[dayItems.length - 1];
        const [h, m] = lastItem.timeSlotStr.split(':').map(Number);
        
        let newH = h + 1; 
        if (newH >= 24) newH = 23;
        
        return `${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const refreshItineraryData = async () => {
        if (itinerary.items.length === 0) return;

        try {
            const idsToFetch = itinerary.items
                .filter(item => !item.isCustom && item.poi && item.poi.id)
                .map(item => item.poi.id);

            if (idsToFetch.length === 0) return;

            const freshPois = await getPoisByIds(idsToFetch);

            const updatedItems = itinerary.items.map((item) => {
                if (item.isCustom) return item;
                const freshPoi = freshPois.find(p => p.id === item.poi.id);
                if (freshPoi) {
                    return { ...item, poi: freshPoi };
                }
                return item;
            });
            
            setItinerary(prev => ({ ...prev, items: updatedItems }));
            console.log("Dati diario aggiornati dal Cloud!");

        } catch (e) {
            console.error("Refresh itinerary error:", e);
            console.error("Errore durante l'aggiornamento dei dati.");
        }
    };

    return (
        <ItineraryContext.Provider value={{ itinerary, setItinerary, savedProjects, saveProject, loadProject, deleteProject, highlightDates, setHighlightDates, highlightedItemId, setHighlightedItemId, addItem, removeItem, updateDayStyle, updateRoadbook, clearItinerary, importPremadeItinerary, findFreeSlot, refreshItineraryData, syncCloudDrafts }}>
            {children}
        </ItineraryContext.Provider>
    );
};

export const useItinerary = () => {
    const context = useContext(ItineraryContext);
    if (!context) throw new Error("useItinerary must be used within ItineraryProvider");
    return context;
};
