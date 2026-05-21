
import { ensureArray } from '../shared/ensureArray';
import { ensureString } from '../shared/ensureString';

/**
 * PARSER: Logs
 * Normalizza array di stringhe (es: generation_logs).
 * Filtra item non validi e garantisce l'osservabilità in DEV.
 */
export const parseLogs = (raw: any): string[] => {
    const rawArray = ensureArray<unknown>(raw);
    
    return rawArray.reduce<string[]>((acc, item, index) => {
        if (typeof item === 'string') {
            acc.push(item);
        } else if (import.meta.env.DEV && item !== null) {
            console.warn(`[Parser:Logs] Invalid log item at index ${index}:`, item);
        }
        return acc;
    }, []);
};
