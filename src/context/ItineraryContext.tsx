
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { Itinerary, ItineraryItem, PointOfInterest, PremadeItinerary, RoadbookDay, createEmptyItinerary } from '../types/index';
import { useUser } from './UserContext';
import { ItineraryStorageManager } from '../services/itineraryStorageManager';
import { randomUUID } from '../utils/runtimeId';
import type { SaveUserDraftViaggioOptions } from '../types/resourceAssociation';

interface ItineraryContextType {
    itinerary: Itinerary;
    setItinerary: React.Dispatch<React.SetStateAction<Itinerary>>;
    /** Lista Diari accessibili (non Aggregate Root — l'identità patrimonio è il Viaggio). */
    savedProjects: Itinerary[];
    /** Viaggio attivo in sessione (padre del Diario aperto, se noto). */
    activeViaggioId: string | null;
    saveProject: (
        name?: string,
        isSaveAs?: boolean,
        viaggioOptions?: SaveUserDraftViaggioOptions,
    ) => Promise<string | null>;
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
    syncCloudDrafts: () => Promise<void>;
}

const ItineraryContext = createContext<ItineraryContextType | undefined>(undefined);

export const ItineraryProvider = ({ children }: { children?: ReactNode }) => {
    // Accesso all'utente corrente per filtrare i dati
    const userContext = useUser();
    const user = userContext?.user;
    const prevUserIdRef = useRef<string>(user?.id || 'guest');

    const [itinerary, setItinerary] = useState<Itinerary>(createEmptyItinerary);
    const [savedProjects, setSavedProjects] = useState<Itinerary[]>([]);
    const [activeViaggioId, setActiveViaggioId] = useState<string | null>(null);
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
        setItinerary(createEmptyItinerary());
        setActiveViaggioId(null);
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
    }, [user?.id, clearItinerary]);

    // Sync manuale
    const syncCloudDrafts = useCallback(async () => {
        if (!user?.id || user.id === 'guest') return;
        try {
            const projects = await ItineraryStorageManager.loadProjects(user);
            setSavedProjects(projects);
        } catch (e) {
            console.error("Sync error:", e);
        }
    }, [user]);

    const saveProject = useCallback(async (
        nameOverride?: string,
        isSaveAs?: boolean,
        viaggioOptions?: SaveUserDraftViaggioOptions,
    ): Promise<string | null> => {
        const targetUser = user;
        const isGuest = !targetUser || targetUser.role === 'guest';

        const targetName = nameOverride || itinerary.name;
        if (!targetName) {
            console.warn("Inserisci un nome per il viaggio.");
            return null;
        }

        let targetId = itinerary.id;

        const isTempId = !targetId || targetId.startsWith('imported-') || targetId.startsWith('ai-it-') || targetId.startsWith('draft_') || targetId.startsWith('it-');

        const existsInSaved = savedProjects.some(p => p.id === targetId);
        const isGhostId = !isGuest && !isTempId && !existsInSaved;

        const isSaveAsNewCopy = isSaveAs && targetName !== itinerary.name;

        if (isTempId || isGhostId || isSaveAsNewCopy) {
            console.log("[Itinerary] Generating fresh UUID for project (Temp, Ghost, or SaveAs with new name detected)");
            targetId = randomUUID();
        }

        const needsNewViaggio = isTempId || isGhostId || isSaveAsNewCopy;

        let resolvedViaggioId: string | null = needsNewViaggio
            ? null
            : (itinerary.viaggioId ?? null);

        if (isSaveAsNewCopy && viaggioOptions) {
            if (viaggioOptions.viaggioChoice === 'existing' && viaggioOptions.existingViaggioId) {
                resolvedViaggioId = viaggioOptions.existingViaggioId;
            } else if (viaggioOptions.viaggioChoice === 'none') {
                resolvedViaggioId = null;
            } else if (viaggioOptions.viaggioChoice === 'new') {
                resolvedViaggioId = null;
            }
        }

        const saveObject: Itinerary = {
            ...itinerary,
            id: targetId,
            name: targetName,
            userId: isGuest ? 'guest' : targetUser.id,
            createdAt: itinerary.createdAt || Date.now(),
            viaggioId: resolvedViaggioId,
        };

        // Aggiornamento ottimistico del modello locale PRIMA della persistenza cloud:
        // la UI riflette subito id/nome/identità del Diario (Save / Save As) senza attendere
        // la round-trip. Se il remote fallisce, lo stato locale può restare su saveObject;
        // il chiamante potrà riallinearsi con un successivo reload/sync da storage.
        // Non spostare dopo il save: cambierebbe il comportamento attuale in caso di errore.
        setItinerary(saveObject);

        try {
            const success = await ItineraryStorageManager.saveProject(
                saveObject,
                targetUser,
                isSaveAsNewCopy ? viaggioOptions : undefined,
            );

            if (success) {
                if (saveObject.viaggioId) {
                    setActiveViaggioId(saveObject.viaggioId);
                }

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
                        // Solo per recuperare il viaggioId assegnato dal backend sul Diario salvato.
                        const synced = fresh.find(p => p.id === saveObject.id);
                        if (synced?.viaggioId) {
                            setActiveViaggioId(synced.viaggioId);
                            // Sincronizza in stato locale l'identità Viaggio restituita dal backend.
                            setItinerary(prev =>
                                prev.id === synced.id
                                    ? { ...prev, viaggioId: synced.viaggioId }
                                    : prev
                            );
                        }
                    } catch (e) {
                        console.warn("Sync post-save failed but save was successful.");
                    }
                }
                return saveObject.id;
            } else {
                console.error("Errore durante il salvataggio. Riprova.");
                return null;
            }
        } catch (error) {
            console.error("Errore durante il salvataggio in cloud:", error);
            return null;
        }
    }, [itinerary, user, savedProjects]);

    const loadProject = useCallback((project: Itinerary) => {
        setItinerary(project);
        setActiveViaggioId(project.viaggioId ?? null);
    }, []);

    // DELETE PROJECT (Diario). active_diary_id sul Viaggio → SET NULL via FK; no auto-promote.
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
                } catch (e) {
                    console.warn("Sync post-delete failed but delete was successful.");
                }
            }
        } else {
            throw new Error("Errore cancellazione: ID non trovato o permessi mancanti. Verifica la connessione.");
        }

        // --- RESET ID ATTIVO SE CANCELLATO ---
        if (itinerary.id === cleanId) {
            console.log("[Itinerary] Deleted active diary. Resetting to temp draft (Viaggio non auto-promosso).");
            // Prefisso `draft_` richiesto da isTempId / suitcaseAssociation — randomUUID() altererebbe quel percorso.
            setItinerary(prev => ({
                ...prev,
                id: `draft_${Date.now()}`,
                viaggioId: null,
            }));
            setActiveViaggioId(null);
        }

    }, [user, itinerary.id]);

    const addItem = useCallback((item: ItineraryItem) => {
        setItinerary(prev => ({ ...prev, items: [...prev.items, item] }));
        setHighlightedItemId(item.id);
    }, []);

    const removeItem = useCallback((id: string) => {
        setItinerary(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
    }, []);

    const updateDayStyle = useCallback((dayIndex: number, colorClass: string) => {
        setItinerary(prev => ({ ...prev, dayStyles: { ...prev.dayStyles, [dayIndex]: colorClass } }));
    }, []);

    const updateRoadbook = useCallback((data: RoadbookDay[]) => {
        setItinerary(prev => ({ ...prev, roadbook: data }));
    }, []);

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

        const newId = randomUUID();

        setItinerary({
            id: newId,
            userId: user ? user.id : 'guest',
            viaggioId: null,
            name: template.title,
            startDate: startD,
            endDate: end.toISOString().split('T')[0],
            items: newItems,
            createdAt: Date.now(),
            dayStyles: {},
            roadbook: [],
            diaryNotes: null,
        });
        setActiveViaggioId(null);
    }, [user]);

    const findFreeSlot = useCallback((dayIndex: number) => {
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
    }, [itinerary.items]);

    const value = useMemo<ItineraryContextType>(() => ({
        itinerary,
        setItinerary,
        savedProjects,
        activeViaggioId,
        saveProject,
        loadProject,
        deleteProject,
        highlightDates,
        setHighlightDates,
        highlightedItemId,
        setHighlightedItemId,
        addItem,
        removeItem,
        updateDayStyle,
        updateRoadbook,
        clearItinerary,
        importPremadeItinerary,
        findFreeSlot,
        syncCloudDrafts,
    }), [
        itinerary,
        savedProjects,
        activeViaggioId,
        saveProject,
        loadProject,
        deleteProject,
        highlightDates,
        highlightedItemId,
        addItem,
        removeItem,
        updateDayStyle,
        updateRoadbook,
        clearItinerary,
        importPremadeItinerary,
        findFreeSlot,
        syncCloudDrafts,
    ]);

    return (
        <ItineraryContext.Provider value={value}>
            {children}
        </ItineraryContext.Provider>
    );
};

export const useItinerary = () => {
    const context = useContext(ItineraryContext);
    if (!context) throw new Error("useItinerary must be used within ItineraryProvider");
    return context;
};
