
import { useState, useEffect, useCallback } from 'react';
import { CityDetails } from '../types/index';
import { getCityDetails } from '../services/cityService';

export const useCityData = (cityId: string | null) => {
  const [city, setCity] = useState<CityDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Funzione di caricamento isolata per poterla richiamare
  const load = useCallback(async () => {
    if (!cityId) {
      setCity(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
        const data = await getCityDetails(cityId);
        if (data) {
            setCity(data);
        } else {
            setError('Dati città non disponibili.');
        }
    } catch (err) {
        console.error(err);
        setError('Errore durante il caricamento dei dati.');
    } finally {
        setLoading(false);
    }
  }, [cityId]);

  useEffect(() => {
    let isMounted = true;

    // Esegue il load iniziale
    load();

    // LISTENER PER REFRESH GLOBALE
    // Questo permette ai modali (es. AdminSave) di dire "Hey, i dati sono cambiati, ricaricali!"
    // senza dover ricaricare l'intera pagina del browser.
    const handleGlobalRefresh = (e: CustomEvent) => {
        // Se l'evento non specifica un ID, o specifica QUESTO ID, ricarica.
        if (!e.detail?.cityId || e.detail?.cityId === cityId) {
            if (isMounted) load();
        }
    };

    window.addEventListener('refresh-city-data', handleGlobalRefresh as EventListener);

    return () => {
      isMounted = false;
      window.removeEventListener('refresh-city-data', handleGlobalRefresh as EventListener);
    };
  }, [load, cityId]);

  return { city, loading, error, refresh: load };
};
