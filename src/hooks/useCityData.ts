
import { useState, useEffect, useCallback, useRef } from 'react';
import { CityDetails } from '../types/index';
import { getCityDetails } from '../services/cityService';

export const useCityData = (cityId: string | null) => {
  const [city, setCity] = useState<CityDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Funzione di caricamento isolata per poterla richiamare
  const load = useCallback(async () => {
    if (!cityId) {
      setCity(null);
      return;
    }

    // Cancella eventuale fetch precedente ancora in corso
    if (abortControllerRef.current) {
      console.log(`[FetchAbort] Aborting previous request for city data.`);
      abortControllerRef.current.abort();
    }

    // Crea un nuovo controller per questa fetch
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const data = await getCityDetails(cityId, controller.signal);
      console.log('[CITY_TRACE] useCityData result', {
        requestedCityId: cityId,
        receivedId: data?.id,
        hasCoords: !!data?.coords,
        hasDetails: !!data?.details,
        cityName: data?.name
      });
      setCity(data);
      if (!data) {
        setError('Dati città non disponibili.');
      }
    } catch (err: any) {
      // Ignora silenziosamente gli errori di cancellazione (AbortError)
      if (err.name === 'AbortError') {
        console.log(`[FetchAbort] Request for city ${cityId} was aborted.`);
        return;
      }
      console.error(err);
      setError('Errore durante il caricamento dei dati.');
    } finally {
      // Se il controller è ancora quello di questa esecuzione, togliamo il loading
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [cityId]);

  useEffect(() => {
    // Esegue il load iniziale
    load();

    // LISTENER PER REFRESH GLOBALE
    const handleGlobalRefresh = (e: CustomEvent) => {
      if (!e.detail?.cityId || e.detail?.cityId === cityId) {
        load();
      }
    };

    window.addEventListener('refresh-city-data', handleGlobalRefresh as EventListener);

    return () => {
      // Cleanup: annulla la fetch in corso allo smontaggio
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      window.removeEventListener('refresh-city-data', handleGlobalRefresh as EventListener);
    };
  }, [load, cityId]);

  return { city, loading, error, refresh: load };
};
