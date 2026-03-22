import { useState, useCallback } from 'react';

interface GpsResult {
    success: boolean;
    coords?: { lat: number; lng: number };
    error?: string;
    isCriticalError?: boolean;
}

// ✅ FIX: riceve configs dall'esterno (NO useConfig qui dentro)
export const useGpsManager = (configs: any) => {
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearPosition = useCallback(() => {
        setUserLocation(null);
        setError(null);
    }, []);

    // Funzione interna promisificata per getCurrentPosition
    const getPositionPromise = useCallback((highAccuracy: boolean): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
            const geoOptions = configs?.geo_options || {};

            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: geoOptions.enableHighAccuracy ?? highAccuracy,
                timeout: geoOptions.timeout ?? 8000,
                maximumAge: geoOptions.maximumAge ?? 0
            });
        });
    }, [configs]); // ✅ FIX: dipendenza corretta

    const requestPosition = useCallback(async (): Promise<GpsResult> => {
        setIsLocating(true);
        setError(null);

        // 1. Check Supporto Browser
        if (!("geolocation" in navigator)) {
            setIsLocating(false);
            const msg = "Il tuo browser non supporta la geolocalizzazione.";
            setError(msg);
            return { success: false, error: msg, isCriticalError: true };
        }

        try {
            // 2. Tentativo 1: Alta Precisione
            try {
                const position = await getPositionPromise(true);
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setUserLocation(coords);
                setIsLocating(false);
                return { success: true, coords };
            } catch (err) {
                console.warn("GPS High Accuracy failed, trying fallback...", err);
            }

            // 3. Tentativo 2: Bassa Precisione (Fallback)
            const position = await getPositionPromise(false);
            const coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            setUserLocation(coords);
            setIsLocating(false);
            return { success: true, coords };

        } catch (error: any) {
            // 4. Gestione Errori Avanzata
            setIsLocating(false);
            console.error("GPS Final Error:", error);

            let msg = "Impossibile recuperare la posizione.";
            let isCritical = false;

            switch(error.code) {
                case 1: // PERMISSION_DENIED
                    if (!window.isSecureContext) {
                        msg = "Il GPS richiede una connessione sicura (HTTPS).";
                    } else {
                        try {
                            const perm = await navigator.permissions.query({ name: 'geolocation' });
                            if (perm.state === 'denied') {
                                msg = "L'accesso è bloccato dal browser. Clicca sull'icona del lucchetto 🔒 o nelle impostazioni del sito per sbloccarlo.";
                                isCritical = true;
                            } else {
                                msg = "Accesso negato dal Sistema Operativo. Controlla: Impostazioni di Sistema > Privacy > Localizzazione.";
                                isCritical = true;
                            }
                        } catch(e) {
                            msg = "Permesso negato. Verifica le impostazioni del browser e del sistema.";
                            isCritical = true;
                        }
                    }
                    break;
                case 2: // POSITION_UNAVAILABLE
                    msg = "Segnale GPS assente. Assicurati di avere la posizione attiva sul dispositivo.";
                    break;
                case 3: // TIMEOUT
                    msg = "La richiesta è scaduta. Il segnale è troppo debole. Riprova all'aperto.";
                    break;
            }
            
            setError(msg);
            return { success: false, error: msg, isCriticalError: isCritical };
        }
    }, [getPositionPromise]); // ✅ FIX CRITICO

    return {
        userLocation,
        isLocating,
        error,
        // Methods
        setUserLocation, // Esposto per override manuale (es. da mappa)
        requestPosition,
        clearPosition
    };
};