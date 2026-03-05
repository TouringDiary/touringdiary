
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { getStorageItem, setStorageItem } from '../services/storageService';

/**
 * Un hook che funziona come useState, ma persiste il valore nel localStorage (in modo SICURO).
 * Usa storageService per garantire fallback in memoria se il browser blocca i cookie.
 * 
 * @param key La chiave univoca per lo storage
 * @param initialValue Il valore iniziale di default
 */
export function usePersistedState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
    // 1. Inizializzazione Lazy: Legge da storage sicuro o usa il default
    const [state, setState] = useState<T>(() => {
        return getStorageItem<T>(key, initialValue);
    });

    // 2. Sincronizzazione: Scrive nello storage sicuro ad ogni cambio di stato
    useEffect(() => {
        setStorageItem(key, state);
    }, [key, state]);

    return [state, setState];
}
