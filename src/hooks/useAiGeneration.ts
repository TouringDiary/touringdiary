import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAiPlanner } from '@/context/AiPlannerContext';
import { useItinerary } from '@/context/ItineraryContext';
import { useUser } from '@/context/UserContext';
import { POI_CATEGORY_VALUES } from '../constants/governance';
import { generateItineraryPlan } from '../services/ai';
import { aiErrorModalTitle, aiErrorUserMessage, isAiEdgeError } from '../services/ai/aiEdgeErrors';
import { getAiRuntimeStatus } from '../services/ai/aiRuntimeStatus';
import { getFullManifestAsync, getPoisByCityIds } from '../services/cityService';
import { calculateDistance } from '../services/geo';
import { getUserAiLimits } from '../services/subscriptionService';
import type { CitySummary, ItineraryItem, PoiCategory, PointOfInterest } from '../types/index';

interface UseAiGenerationProps {
  onClose: () => void;
}

export const useAiGeneration = ({ onClose }: UseAiGenerationProps) => {
  const { city: citySlug } = useParams<{ city: string }>();
  const { aiSession, updateAiSession, resetAiSession } = useAiPlanner();
  const { setItinerary, clearItinerary } = useItinerary();
  const { user } = useUser();

  // STATE
  const [loading, setLoading] = useState(false);
  const [manifest, setManifest] = useState<CitySummary[]>([]);
  const [candidatePoisCache, setCandidatePoisCache] = useState<PointOfInterest[]>([]);

  // UI FLAGS
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [showQuotaAlert, setShowQuotaAlert] = useState(false);
  const [quotaLimit, setQuotaLimit] = useState(0);
  const [warningModal, setWarningModal] = useState<{ title: string; message: string } | null>(null);
  const [errorModal, setErrorModal] = useState<{ title: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // REFS
  const confirmResolver = useRef<((value: boolean) => void) | null>(null);
  const prevCitySlugRef = useRef<string | undefined>(citySlug);

  // Ref per gestire l'interruzione
  const abortControllerRef = useRef<AbortController | null>(null);

  const waitForConfirmation = (signal: AbortSignal): Promise<boolean> => {
    return new Promise((resolve) => {
      if (signal.aborted) {
        resolve(false);
        return;
      }

      const settle = (value: boolean) => {
        signal.removeEventListener('abort', onAbort);
        if (confirmResolver.current === settle) {
          confirmResolver.current = null;
        }
        resolve(value);
      };

      const onAbort = () => {
        setWarningModal(null);
        settle(false);
      };

      confirmResolver.current = settle;
      signal.addEventListener('abort', onAbort);
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
      abortControllerRef.current.abort();
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getFullManifestAsync().then((data) => {
      if (!cancelled) setManifest(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ISOLAMENTO CONTESTO: Al cambio città, resettiamo tutto per evitare context bleeding
  // Utilizziamo un controllo sul ref per assicurarci che il reset avvenga SOLO al cambio slug reale
  useEffect(() => {
    if (citySlug !== prevCitySlugRef.current) {
      console.log(
        `[AIContextReset] City change detected: ${prevCitySlugRef.current} -> ${citySlug}. Resetting session.`,
      );
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
      abortControllerRef.current?.abort();
    };
  }, []);

  const generatePlan = async () => {
    if (loading) return;

    if (!aiSession.destination || !aiSession.startDate || !aiSession.endDate) {
      setShowValidationAlert(true);
      return;
    }

    const runtimeStatus = getAiRuntimeStatus({
      userRole: user?.role ?? null,
      isAuthenticated: Boolean(user && user.role !== 'guest'),
    });
    if (!runtimeStatus.available) {
      setErrorModal({
        title:
          runtimeStatus.title ||
          (runtimeStatus.reason === 'EMERGENCY_STOP' ? 'Servizi AI sospesi' : 'Manutenzione AI'),
        message: runtimeStatus.message || 'I servizi AI non sono disponibili al momento.',
      });
      return;
    }

    // 1. Reset & Setup nuovo Controller
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setError(null);
    setCandidatePoisCache([]);

    // Wrap everything in a top-level try-catch to ensure we catch abortions
    try {
      const matchedCity = manifest.find(
        (c) => c.name.toLowerCase() === aiSession.destination.trim().toLowerCase(),
      );
      if (!matchedCity) {
        setError(`La città "${aiSession.destination}" non è attualmente censita in Touring Diary.`);
        return;
      }

      setLoading(true);

      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

      // Geofencing
      const maxKm = aiSession.globalMaxDistance || 5;
      let targetCityIds = manifest
        .filter((c) => {
          if (c.id === matchedCity.id) return true;
          const dist = calculateDistance(
            matchedCity.coords.lat,
            matchedCity.coords.lng,
            c.coords.lat,
            c.coords.lng,
          );
          return dist <= maxKm;
        })
        .map((c) => c.id);

      let allCandidatePois = await getPoisByCityIds(targetCityIds);

      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

      if (allCandidatePois.length === 0) {
        setWarningModal({
          title: 'Nessun POI trovato',
          message: `Non abbiamo trovato luoghi nel raggio di ${maxKm}km. Espando la ricerca a tutta la città?`,
        });
        const proceed = await waitForConfirmation(signal);

        // Check abort anche dopo l'attesa utente
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        if (!proceed) {
          return;
        }

        targetCityIds = [matchedCity.id];
        allCandidatePois = await getPoisByCityIds(targetCityIds);
      }

      if (allCandidatePois.length === 0) {
        throw new Error(
          `Nessun punto di interesse trovato nel database per ${aiSession.destination}.`,
        );
      }

      // --- SMART ACCOMMODATION LOGIC ---
      let calculatedStart = aiSession.startLocation;
      let calculatedEnd = aiSession.endLocation;

      if (!calculatedStart?.trim() || !calculatedEnd?.trim()) {
        const accommodations = allCandidatePois.filter((p) => p.category === 'hotel');

        accommodations.sort((a, b) => {
          if (a.tier === 'gold' && b.tier !== 'gold') return -1;
          if (b.tier === 'gold' && a.tier !== 'gold') return 1;
          const ar = a.rating;
          const br = b.rating;
          if (ar == null && br == null) return 0;
          if (ar == null) return 1;
          if (br == null) return -1;
          return br - ar;
        });

        const topHotel = accommodations[0];
        if (topHotel) {
          const smartName = topHotel.name;
          if (!calculatedStart?.trim()) calculatedStart = smartName;
          if (!calculatedEnd?.trim()) calculatedEnd = smartName;
          // topHotel proviene già da allCandidatePois — nessun re-insert necessario
        } else {
          const smartName = `Centro di ${matchedCity.name}`;
          if (!calculatedStart?.trim()) calculatedStart = smartName;
          if (!calculatedEnd?.trim()) calculatedEnd = smartName;
        }
      }

      const enforcedLogistics = aiSession.dailyLogistics.map((log) => ({
        ...log,
        start: !log.start || log.start.trim() === '' ? calculatedStart : log.start,
        end: !log.end || log.end.trim() === '' ? calculatedEnd : log.end,
      }));

      if (enforcedLogistics.length === 0) {
        for (let i = 0; i < aiSession.daysCount; i++) {
          enforcedLogistics.push({
            dayIndex: i,
            start: calculatedStart,
            end: calculatedEnd,
            startTime: aiSession.startTime,
            endTime: aiSession.endTime,
          });
        }
      }

      setCandidatePoisCache(allCandidatePois);

      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

      const poisForAi = allCandidatePois.map((p) => {
        const coords = p.coords;
        const hasCoords =
          !!coords &&
          Number.isFinite(coords.lat) &&
          Number.isFinite(coords.lng) &&
          !(coords.lat === 0 && coords.lng === 0);
        return {
          id: p.id,
          name: p.name.replace(/["\\]/g, ''),
          category: p.category,
          subCategory: p.subCategory,
          rating: p.rating,
          ...(hasCoords
            ? {
                lat: Number(coords.lat.toFixed(4)),
                lng: Number(coords.lng.toFixed(4)),
              }
            : {}),
        };
      });

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
          endTime: aiSession.endTime,
        },
        signal, // Passiamo il signal al service
      );

      if (!generatedPlan || generatedPlan.length === 0) {
        throw new Error("L'AI non ha generato nessuna tappa valida.");
      }

      const minDayIndex = Math.min(...generatedPlan.map((i) => i.dayIndex));
      const normalizedPlan = generatedPlan.map((i) => ({
        ...i,
        dayIndex: i.dayIndex - minDayIndex,
      }));

      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

      updateAiSession({
        generatedPlan: normalizedPlan,
        startLocation: calculatedStart,
        endLocation: calculatedEnd,
        dailyLogistics: enforcedLogistics,
      });
    } catch (e: unknown) {
      // Gestione specifica AbortError
      const errName = e instanceof Error ? e.name : undefined;
      const errMsg = e instanceof Error ? e.message : String(e);
      if (errName === 'AbortError' || errMsg === 'Aborted' || errMsg === 'Canceled') {
        console.debug("[AI Planner] Generazione interrotta dall'utente (Handled).");
        return; // Esce silenziosamente — loading: cancelGeneration o finally
      }

      console.error('AI Gen Error:', e);

      if (isAiEdgeError(e)) {
        if (e.code === 'RATE_LIMIT') {
          // Limite reale dal piano (soft_daily_limit); nessun numero inventato.
          if (user?.id) {
            try {
              const limits = await getUserAiLimits(user.id);
              if (limits && Number.isFinite(limits.soft_daily_limit)) {
                setQuotaLimit(limits.soft_daily_limit);
              }
            } catch (limitErr) {
              console.error('[AI Planner] Impossibile leggere soft_daily_limit:', limitErr);
            }
          }
          setShowQuotaAlert(true);
          return;
        }
        setErrorModal({
          title: aiErrorModalTitle(e),
          message: e instanceof Error ? e.message : String(e),
        });
        return;
      }

      setErrorModal({
        title: 'Errore Generazione',
        message: aiErrorUserMessage(e, 'Errore tecnico del server AI.'),
      });
    } finally {
      // Abort: loading già false via cancelGeneration, oppure skip post-unmount.
      // Success / decline / errori non-abort: unica chiusura loading qui.
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  const applyPlanToItinerary = () => {
    if (!aiSession.generatedPlan) return;
    clearItinerary();

    const newItems: ItineraryItem[] = aiSession.generatedPlan.map((item, index) => {
      const realPoi = candidatePoisCache.find((p) => p.id === item.matchedPoiId);

      const isCustom = !realPoi || item.category === 'hotel';
      const cleanName = item.activityName
        .replace(/^(Partenza da|Rientro a|Partenza|Rientro)[:\s]*/i, '')
        .trim();

      const aiCategory: PoiCategory =
        POI_CATEGORY_VALUES.find((c) => c === item.category) ?? 'discovery';

      // Coordinate AI usabili: finite e non il placeholder (0,0) usato nel codebase per "mancante".
      const hasAiCoords =
        Number.isFinite(item.lat) &&
        Number.isFinite(item.lng) &&
        !(item.lat === 0 && item.lng === 0);

      const poiData: PointOfInterest = realPoi
        ? {
            id: realPoi.id,
            name: realPoi.name,
            category: realPoi.category,
            description: isCustom ? cleanName : item.description,
            imageUrl: realPoi.imageUrl,
            rating: realPoi.rating,
            votes: realPoi.votes,
            coords: realPoi.coords,
            address: realPoi.address,
            visitDuration: item.visitDuration ?? realPoi.visitDuration,
            cityId: realPoi.cityId,
          }
        : {
            id: item.matchedPoiId || `ai-gen-${index}`,
            name: cleanName,
            category: aiCategory,
            description: cleanName,
            address: item.address,
            visitDuration: item.visitDuration,
            ...(hasAiCoords ? { coords: { lat: item.lat, lng: item.lng } } : {}),
          };

      return {
        id: `ai_item_${Date.now()}_${index}`,
        cityId: realPoi?.cityId || aiSession.destination.toLowerCase(),
        poi: poiData,
        dayIndex: item.dayIndex,
        timeSlotStr: item.time,
        notes: item.description,
        isCustom: isCustom,
        customIcon: item.category === 'hotel' ? 'bed' : undefined,
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
      roadbook: [],
    });

    onClose();
  };

  return {
    loading,
    setLoading,
    error,
    showValidationAlert,
    setShowValidationAlert,
    showQuotaAlert,
    setShowQuotaAlert,
    quotaLimit,
    warningModal,
    handleConfirmWarning,
    errorModal,
    setErrorModal,
    generatePlan,
    applyPlanToItinerary,
    cancelGeneration,
  };
};
