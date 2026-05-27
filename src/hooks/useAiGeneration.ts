import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { generateItineraryPlan } from '../services/ai';
import { getFullManifestAsync, getPoisByCityIds } from '../services/cityService';
import { calculateDistance } from '../services/geo';
import { POI_CATEGORY_VALUES } from '../constants/governance';
import { PointOfInterest, CitySummary, ItineraryItem, PoiCategory } from '../types/index';
import { useItinerary } from '@/context/ItineraryContext';
import { useAiPlanner } from '@/context/AiPlannerContext';
import { aiErrorModalTitle, aiErrorUserMessage, isAiEdgeError } from '../services/ai/aiEdgeErrors';
import { getAiRuntimeStatus } from '../services/ai/aiRuntimeStatus';

interface UseAiGenerationProps {
    onClose: () => void;
}

export const useAiGeneration = ({ onClose }: UseAiGenerationProps) => {
    const { city: citySlug } = useParams<{ city: string }>();
    const { aiSession, updateAiSession, resetAiSession } = useAiPlanner();
    const { setItinerary, clearItinerary } = useItinerary();

    // STATE
    const [loading, setLoading] = useState(false);
    const [manifest, setManifest] = useState<CitySummary[]>([]);
    const [candidatePoisCache, setCandidatePoisCache] = useState<PointOfInterest[]>([]);
    
    // UI FLAGS
    const [showValidationAlert, setShowValidationAlert] = useState(false);
    const [showQuotaAlert, setShowQuotaAlert] = useState(false);
    const [quotaLimit, setQuotaLimit] = useState(0);
    const [warningModal, setWarningModal] = useState<{title: string, message: string} | null>(null);
    const [errorModal, setErrorModal] = useState<{title: string, message: string} | null>(null);
    const [error, setError] = useState<string | null>(null);

    // REFS
    const confirmResolver = useRef<((value: boolean) => void) | null>(null);
    const prevCitySlugRef = useRef<string | undefined>(citySlug);
    
    // Ref per gestire l'interruzione
    const abortControllerRef = useRef<AbortController | null>(null);

    const waitForConfirmation = (): Promise<boolean> => {
        return new Promise((resolve) => {
            confirmResolver.current = resolve;
        });
    };

    const handleConfirmWarning = (proceed: boolean) => {
        if (confirmResolver.current) {
            confirmResolver.current(proceed);
            confirmResolver.current = null;
        }
        setWarningModal(null);
    };

    // Funzione esposta per annullare manualmente
    const cancelGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            console.log("[AI Planner] Cancellazione richiesta dall'utente.");
            try { abortControllerRef.current.abort(); } catch(e) {}
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        getFullManifestAsync().then(setManifest);
    }, []);

    // ISOLAMENTO CONTESTO: Al cambio città, resettiamo tutto per evitare context bleeding
    // Utilizziamo un controllo sul ref per assicurarci che il reset avvenga SOLO al cambio slug reale
    useEffect(() => {
        if (citySlug !== prevCitySlugRef.current) {
            console.log(`[AIContextReset] City change detected: ${prevCitySlugRef.current} -> ${citySlug}. Resetting session.`);
            if (loading) {
                cancelGeneration();
            }
            resetAiSession();
            prevCitySlugRef.current = citySlug;
        }
    }, [citySlug, loading, cancelGeneration, resetAiSession]);

    // Cleanup: Se il componente si smonta (es. chiudo modale), abortisco tutto.
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                // Catch any error during cleanup abort
                try { abortControllerRef.current.abort(); } catch(e) {}
            }
        };
    }, []);

    const generatePlan = async () => {
        if (loading) return;

        if (!aiSession.destination || !aiSession.startDate || !aiSession.endDate) {
            setShowValidationAlert(true);
            return;
        }

        const runtimeStatus = getAiRuntimeStatus();
        if (!runtimeStatus.available) {
            setErrorModal({
                title: runtimeStatus.reason === 'EMERGENCY_STOP' ? 'Servizi AI sospesi' : 'Manutenzione AI',
                message: runtimeStatus.message || 'I servizi AI non sono disponibili al momento.',
            });
            return;
        }

        // 1. Reset & Setup nuovo Controller
        if (abortControllerRef.current) {
            try { abortControllerRef.current.abort(); } catch(e) {}
        }
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setError(null);
        setCandidatePoisCache([]);

        // Wrap everything in a top-level try-catch to ensure we catch abortions
        try {
            const matchedCity = manifest.find(c => c.name.toLowerCase() === aiSession.destination.trim().toLowerCase());
            if (!matchedCity) {
                setError(`La città "${aiSession.destination}" non è attualmente censita in Touring Diary.`);
                return;
            }

            setLoading(true);

            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

            // Geofencing
            const maxKm = aiSession.globalMaxDistance || 5;
            let targetCityIds = manifest.filter(c => {
                if (c.id === matchedCity.id) return true;
                const dist = calculateDistance(matchedCity.coords.lat, matchedCity.coords.lng, c.coords.lat, c.coords.lng);
                return dist <= maxKm;
            }).map(c => c.id);

            let allCandidatePois = await getPoisByCityIds(targetCityIds);

            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

            if (allCandidatePois.length === 0) {
                 setWarningModal({
                     title: "Nessun POI trovato",
                     message: `Non abbiamo trovato luoghi nel raggio di ${maxKm}km. Espando la ricerca a tutta la città?`
                 });
                 const proceed = await waitForConfirmation();
                 
                 // Check abort anche dopo l'attesa utente
                 if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
                 if (!proceed) { setLoading(false); return; }

                 targetCityIds = [matchedCity.id];
                 allCandidatePois = await getPoisByCityIds(targetCityIds);
            }

            if (allCandidatePois.length === 0) {
                 throw new Error(`Nessun punto di interesse trovato nel database per ${aiSession.destination}.`);
            }

            // --- SMART ACCOMMODATION LOGIC ---
            let calculatedStart = aiSession.startLocation;
            let calculatedEnd = aiSession.endLocation;
            let selectedHotelPoi: PointOfInterest | undefined = undefined;

            if (!calculatedStart || !calculatedStart.trim() || !calculatedEnd || !calculatedEnd.trim()) {
                const accommodations = allCandidatePois.filter(p => p.category === 'hotel');
                
                accommodations.sort((a, b) => {
                    if (a.tier === 'gold' && b.tier !== 'gold') return -1;
                    if (b.tier === 'gold' && a.tier !== 'gold') return 1;
                    return b.rating - a.rating;
                });

                if (accommodations.length > 0) {
                    selectedHotelPoi = accommodations[0];
                    const smartName = selectedHotelPoi.name;
                    if (!calculatedStart || !calculatedStart.trim()) calculatedStart = smartName;
                    if (!calculatedEnd || !calculatedEnd.trim()) calculatedEnd = smartName;
                    
                    if (!allCandidatePois.some(p => p.id === selectedHotelPoi!.id)) {
                        allCandidatePois.push(selectedHotelPoi);
                    }
                } else {
                    const smartName = `Centro di ${matchedCity.name}`;
                    if (!calculatedStart || !calculatedStart.trim()) calculatedStart = smartName;
                    if (!calculatedEnd || !calculatedEnd.trim()) calculatedEnd = smartName;
                }
            }
            
            const enforcedLogistics = aiSession.dailyLogistics.map(log => ({
                ...log,
                start: (!log.start || log.start.trim() === '') ? calculatedStart : log.start,
                end: (!log.end || log.end.trim() === '') ? calculatedEnd : log.end
            }));

            if (enforcedLogistics.length === 0) {
                for (let i = 0; i < aiSession.daysCount; i++) {
                    enforcedLogistics.push({
                        dayIndex: i,
                        start: calculatedStart,
                        end: calculatedEnd,
                        startTime: aiSession.startTime,
                        endTime: aiSession.endTime
                    });
                }
            }
            
            setCandidatePoisCache(allCandidatePois);

            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

            const poisForAi = allCandidatePois.map(p => ({ 
                id: p.id, 
                name: p.name.replace(/["\\]/g, ''), 
                category: p.category, 
                subCategory: p.subCategory,
                rating: p.rating,
                lat: Number(p.coords.lat.toFixed(4)), 
                lng: Number(p.coords.lng.toFixed(4)) 
            }));

            // CHIAMA AI CON DATI FORZATI E SIGNAL
            const generatedPlan = await generateItineraryPlan(
                aiSession.daysCount, 
                aiSession.preferences, 
                aiSession.destination, 
                poisForAi, 
                { 
                    dailyLogistics: enforcedLogistics,
                    startLocation: calculatedStart,
                    endLocation: calculatedEnd,
                    bufferMinutes: aiSession.bufferMinutes,
                    globalMaxDistance: aiSession.globalMaxDistance,
                    style: aiSession.style, 
                    startTime: aiSession.startTime,
                    endTime: aiSession.endTime
                },
                signal // Passiamo il signal al service
            );

            if (!generatedPlan || generatedPlan.length === 0) {
                throw new Error("L'AI non ha generato nessuna tappa valida.");
            }

            const minDayIndex = Math.min(...generatedPlan.map(i => i.dayIndex));
            const normalizedPlan = generatedPlan.map(i => ({
                ...i,
                dayIndex: i.dayIndex - minDayIndex
            }));

            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

            updateAiSession({ 
                generatedPlan: normalizedPlan,
                startLocation: calculatedStart,
                endLocation: calculatedEnd,
                dailyLogistics: enforcedLogistics
            });

        } catch (e: any) {
            // Gestione specifica AbortError
            if (e.name === 'AbortError' || e.message === 'Aborted' || e.message === 'Canceled') {
                console.debug("[AI Planner] Generazione interrotta dall'utente (Handled).");
                setLoading(false);
                return; // Esce silenziosamente
            }

            console.error("AI Gen Error:", e);

            if (isAiEdgeError(e)) {
                if (e.code === 'RATE_LIMIT') {
                    setShowQuotaAlert(true);
                    return;
                }
                setErrorModal({
                    title: aiErrorModalTitle(e),
                    message: e.message,
                });
                return;
            }

            setErrorModal({
                title: "Errore Generazione",
                message: aiErrorUserMessage(e, "Errore tecnico del server AI."),
            });
        } finally {
            // Solo se non abortito (per evitare race condition su state update di un componente smontato)
            if (!signal.aborted) {
                setLoading(false);
            }
        }
    };

    const applyPlanToItinerary = () => {
        if (!aiSession.generatedPlan) return;
        clearItinerary();
        
        const newItems: ItineraryItem[] = aiSession.generatedPlan.map((item, index) => {
            const realPoi = candidatePoisCache.find(p => p.id === item.matchedPoiId);
            
            const isCustom = !realPoi || item.category === 'hotel';
            const cleanName = item.activityName.replace(/^(Partenza da|Rientro a|Partenza|Rientro)[:\s]*/i, "").trim();

            const aiCategory: PoiCategory = (POI_CATEGORY_VALUES as readonly string[]).includes(item.category)
                ? (item.category as PoiCategory)
                : 'discovery';

            const poiData: PointOfInterest = {
                id: realPoi ? realPoi.id : (item.matchedPoiId || `ai-gen-${index}`),
                name: realPoi ? realPoi.name : cleanName,
                category: realPoi ? realPoi.category : aiCategory,
                description: isCustom ? cleanName : item.description,
                imageUrl: realPoi ? realPoi.imageUrl : 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=400',
                rating: realPoi ? realPoi.rating : 0, 
                votes: realPoi ? realPoi.votes : 0, 
                coords: realPoi ? realPoi.coords : { lat: item.lat || 0, lng: item.lng || 0 }, 
                address: realPoi ? realPoi.address : item.address,
                visitDuration: item.visitDuration
            };

            return {
                id: `ai_item_${Date.now()}_${index}`,
                cityId: realPoi ? (realPoi.cityId || aiSession.destination.toLowerCase()) : aiSession.destination.toLowerCase(),
                poi: poiData,
                dayIndex: item.dayIndex, 
                timeSlotStr: item.time, 
                notes: item.description, 
                isCustom: isCustom,
                customIcon: item.category === 'hotel' ? 'bed' : undefined
            };
        });
        
        setItinerary({
            id: `ai-it-${Date.now()}`, 
            name: `Tour a ${aiSession.destination}`,
            startDate: aiSession.startDate, 
            endDate: aiSession.endDate, 
            items: newItems, 
            createdAt: Date.now(), 
            dayStyles: {}, 
            roadbook: []
        });
        
        onClose();
    };

    return {
        loading, setLoading, error,
        showValidationAlert, setShowValidationAlert,
        showQuotaAlert, setShowQuotaAlert, quotaLimit,
        warningModal, handleConfirmWarning,
        errorModal, setErrorModal,
        generatePlan, applyPlanToItinerary,
        cancelGeneration
    };
};
