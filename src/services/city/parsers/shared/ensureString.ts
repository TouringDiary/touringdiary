
/**
 * STABILIZZATORE DI TIPO: String
 * Garantisce che l'output sia una stringa, convertendo null/undefined in "".
 * Non aggiunge fallback semantici (es. N/A).
 */
export const ensureString = (val: any): string => {
    if (typeof val === 'string') return val;
    return '';
};
