
/**
 * STABILIZZATORE DI TIPO: Array
 * Garantisce che l'output sia un array, eliminando null/undefined.
 * Non aggiunge semantica né dati fittizi.
 */
export const ensureArray = <T>(val: unknown): T[] => {
    return Array.isArray(val) ? (val as T[]) : [];
};
