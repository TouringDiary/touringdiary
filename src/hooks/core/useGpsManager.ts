import { useState, useCallback } from 'react';

interface GpsResult {
    success: boolean;
    coords?: { lat: number; lng: number };
    error?: string;
    isCriticalError?: boolean;
}

function isGeolocationPositionError(error: unknown): error is GeolocationPositionError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as GeolocationPositionError).code === 'number'
    );
}

async function queryGeolocationPermission(): Promise<PermissionState | 'unsupported'> {
    try {
        if (!('permissions' in navigator) || !navigator.permissions?.query) {
            return 'unsupported';
        }
        const status = await navigator.permissions.query({ name: 'geolocation' });
        return status.state;
    } catch {
        return 'unsupported';
    }
}

/**
 * True when the failed call was the permission-prompt gate: the user granted
 * access, but the initiating getCurrentPosition still rejected (common on
 * Chromium/WebKit mobile). Not a real hard deny — a follow-up fix is valid.
 */
async function isPermissionPromptArtifact(error: unknown): Promise<boolean> {
    if (!isGeolocationPositionError(error)) return false;
    // PERMISSION_DENIED === 1 (GeolocationPositionError)
    if (error.code !== 1) return false;
    const state = await queryGeolocationPermission();
    return state === 'granted';
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

    const applyPosition = useCallback((position: GeolocationPosition): GpsResult => {
        const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        setUserLocation(coords);
        setIsLocating(false);
        setError(null);
        return { success: true, coords };
    }, []);

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
                return applyPosition(position);
            } catch (err) {
                // Permission-prompt artifact: do not treat as hard deny — continue to a real fix.
                if (await isPermissionPromptArtifact(err)) {
                    console.warn("GPS: permission granted after prompt; acquiring position...", err);
                } else {
                    console.warn("GPS High Accuracy failed, trying fallback...", err);
                }
            }

            // 3. Tentativo 2: Bassa Precisione (Fallback) — also covers post-prompt acquisition
            try {
                const position = await getPositionPromise(false);
                return applyPosition(position);
            } catch (fallbackErr) {
                // 3b. First-click prompt artifact: HA/LA both failed with code 1 while
                // permission is now granted — one dedicated follow-up for the real fix.
                if (await isPermissionPromptArtifact(fallbackErr)) {
                    const position = await getPositionPromise(false);
                    return applyPosition(position);
                }
                throw fallbackErr;
            }

        } catch (error: unknown) {
            // 4. Gestione Errori Avanzata
            setIsLocating(false);
            console.error("GPS Final Error:", error);

            let msg = "Impossibile recuperare la posizione.";
            let isCritical = false;
            const code = isGeolocationPositionError(error) ? error.code : undefined;

            switch (code) {
                case 1: { // PERMISSION_DENIED
                    if (!window.isSecureContext) {
                        msg = "Il GPS richiede una connessione sicura (HTTPS).";
                        isCritical = true;
                        break;
                    }
                    const perm = await queryGeolocationPermission();
                    if (perm === 'denied') {
                        msg = "L'accesso è bloccato dal browser. Clicca sull'icona del lucchetto 🔒 o nelle impostazioni del sito per sbloccarlo.";
                        isCritical = true;
                    } else if (perm === 'granted') {
                        // Should have been recovered above; remaining case = fix failed after grant.
                        msg = "Permesso concesso, ma la posizione non è ancora disponibile. Riprova tra un momento.";
                        isCritical = false;
                    } else {
                        msg = "Accesso negato dal Sistema Operativo. Controlla: Impostazioni di Sistema > Privacy > Localizzazione.";
                        isCritical = true;
                    }
                    break;
                }
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
    }, [getPositionPromise, applyPosition]); // ✅ FIX CRITICO

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
