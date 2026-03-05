
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { CityDetails, CitySummary } from '../types/index';
import { useAdminData } from '../hooks/useAdminData';
import { evaluateAndUpdateCityStatus } from '../services/city/cityUpdateService';

// Definizione della struttura base per una nuova città
const EMPTY_CITY: CityDetails = {
    id: '', name: '', zone: '', adminRegion: 'Campania', nation: 'Italia', continent: 'Europa', description: '', imageUrl: '', rating: 0, visitors: 0, isFeatured: false, coords: { lat: 0, lng: 0 },
    status: 'draft',
    tags: [],
    details: {
        subtitle: '', heroImage: '', historySnippet: '', historyFull: '', historySections: [], historyGallery: [], topAttractions: [], allPois: [], foodSpots: [], hotels: [], newDiscoveries: [], leisureSpots: [],
        ratings: { cultura: 50, monumenti: 50, musei_arte: 50, tradizione: 50, architettura: 50, natura: 50, mare_spiagge: 50, paesaggi: 50, clima: 50, sostenibilita: 50, gusto: 50, cucina: 50, vita_notturna: 50, caffe_bar: 50, mercati: 50, viaggiatore: 50, mobilita: 50, accoglienza: 50, costo: 50, sicurezza: 50 },
        seasonalVisitors: { spring: 0, summer: 0, autumn: 0, winter: 0 },
        services: [], events: [], famousPeople: [], guides: [],
        generationLogs: [],
        patron: '',
        gallery: []
    }
};

// Tipi per la richiesta di anteprima
export type PreviewType = 'none' | 'history' | 'patron' | 'snippet' | 'ratings' | 'header' | 'card' | 'weather' | 'list' | 'guides' | 'events' | 'services' | 'tour_operators';

export interface PreviewRequest {
    type: PreviewType;
    title?: string;
    items?: any[];
}

interface CityEditorContextType {
    // Stato Dati
    city: CityDetails | null;
    isLoading: boolean;
    isSaving: boolean;
    manifest: CitySummary[]; 
    isDirty: boolean; // NEW: Indica se ci sono modifiche non salvate
    
    // Stato UI
    previewRequest: PreviewRequest;
    
    // Azioni Modifica
    updateField: (field: keyof CityDetails, value: any) => void;
    updateDetailField: (field: keyof CityDetails['details'], value: any) => void;
    updateCoord: (type: 'lat' | 'lng', value: string | number) => void;
    setCityDirectly: (newCity: CityDetails | null) => void; 
    
    // Azioni Sistema
    saveCity: (status?: 'published' | 'draft', customSuccessMessage?: string) => Promise<boolean>;
    triggerPreview: (type: PreviewType, title?: string, items?: any[]) => void;
    clearPreviewRequest: () => void;
    refreshData: () => Promise<void>; 
    reloadCurrentCity: () => Promise<void>; 
}

const CityEditorContext = createContext<CityEditorContextType | undefined>(undefined);

interface ProviderProps {
    children?: ReactNode;
    cityId: string;
    onSaveSuccess?: (msg: string) => void;
    onSaveError?: (msg: string) => void;
}

export const CityEditorProvider = ({ children, cityId, onSaveSuccess, onSaveError }: ProviderProps) => {
    const { getFullCity, saveFullCity, cities, refreshManifest } = useAdminData();
    
    const [city, setCity] = useState<CityDetails | null>(null);
    const [originalCity, setOriginalCity] = useState<string>(''); // Salviamo come stringa JSON per confronto facile
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [previewRequest, setPreviewRequest] = useState<PreviewRequest>({ type: 'none' });

    // Caricamento Iniziale
    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setIsLoading(true);
            if (cityId === 'new') {
                if (isMounted) {
                    const empty = { ...JSON.parse(JSON.stringify(EMPTY_CITY)), id: `city_${Date.now()}` };
                    setCity(empty);
                    setOriginalCity(JSON.stringify(empty));
                }
            } else {
                const data = await getFullCity(cityId);
                if (isMounted) {
                    if (data) {
                        setCity(data);
                        setOriginalCity(JSON.stringify(data));
                    }
                    else if (onSaveError) onSaveError("Città non trovata.");
                }
            }
            if (isMounted) setIsLoading(false);
        };
        load();
        return () => { isMounted = false; };
    }, [cityId]); 

    // Calcolo isDirty
    const isDirty = useMemo(() => {
        if (!city) return false;
        return JSON.stringify(city) !== originalCity;
    }, [city, originalCity]);

    // Actions
    const updateField = useCallback((field: keyof CityDetails, value: any) => {
        setCity(prev => prev ? { ...prev, [field]: value } : null);
    }, []);

    const updateDetailField = useCallback((field: keyof CityDetails['details'], value: any) => {
        setCity(prev => prev ? { ...prev, details: { ...prev.details, [field]: value } } : null);
    }, []);

    const updateCoord = useCallback((type: 'lat' | 'lng', value: string | number) => {
        const numVal = typeof value === 'string' ? parseFloat(value) : value;
        setCity(prev => prev ? { ...prev, coords: { ...prev.coords, [type]: numVal } } : null);
    }, []);

    const setCityDirectly = useCallback((newCity: CityDetails | null) => {
        setCity(newCity);
    }, []);

    const reloadCurrentCity = useCallback(async () => {
        if (!cityId || cityId === 'new') return;
        setIsLoading(true);
        try {
            const data = await getFullCity(cityId);
            if (data) {
                setCity(data);
                setOriginalCity(JSON.stringify(data)); // Reset dirty state on reload
            }
        } catch (e) {
            console.error("Reload error", e);
        } finally {
            setIsLoading(false);
        }
    }, [cityId, getFullCity]);

    const saveCity = useCallback(async (status?: 'published' | 'draft', customSuccessMessage?: string): Promise<boolean> => {
        if (!city) return false;
        
        setIsSaving(true);
        try {
            const requestedStatus = status || city.status;
            
            await saveFullCity({ ...city, status: requestedStatus });
            
            // Forza il ricalcolo dello stato basato sulle regole di business (es. POI minimi)
            let finalStatus = requestedStatus;
            try {
                finalStatus = await evaluateAndUpdateCityStatus(city.id);
            } catch (evalError) {
                console.warn("Impossibile ricalcolare lo stato, uso quello richiesto:", evalError);
            }
            
            // Aggiorna lo stato originale e locale per resettare isDirty e mostrare il nuovo stato
            const updatedCity = { ...city, status: finalStatus };
            setCity(updatedCity);
            setOriginalCity(JSON.stringify(updatedCity));
            
            if (onSaveSuccess) {
                if (customSuccessMessage) {
                    onSaveSuccess(customSuccessMessage);
                } else {
                    if (requestedStatus === 'published' && finalStatus !== 'published') {
                        onSaveSuccess("Città salvata. (Non pubblicabile: mancano POI o info base)");
                    } else {
                        onSaveSuccess(finalStatus === 'published' ? "Città pubblicata!" : "Città salvata.");
                    }
                }
            }
            return true;
        } catch (e: any) {
            console.error("Save error:", e);
            if (onSaveError) onSaveError(e.message || "Errore salvataggio.");
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [city, saveFullCity, onSaveSuccess, onSaveError]);

    const triggerPreview = useCallback((type: PreviewType, title?: string, items?: any[]) => {
        setPreviewRequest({ type, title, items });
    }, []);

    const clearPreviewRequest = useCallback(() => {
        setPreviewRequest({ type: 'none' });
    }, []);

    return (
        <CityEditorContext.Provider value={{
            city,
            isLoading,
            isSaving,
            isDirty,
            manifest: cities,
            previewRequest,
            updateField,
            updateDetailField,
            updateCoord,
            setCityDirectly,
            saveCity,
            triggerPreview,
            clearPreviewRequest,
            refreshData: refreshManifest,
            reloadCurrentCity
        }}>
            {children}
        </CityEditorContext.Provider>
    );
};

export const useCityEditor = () => {
    const context = useContext(CityEditorContext);
    if (!context) throw new Error("useCityEditor must be used within CityEditorProvider");
    return context;
};
