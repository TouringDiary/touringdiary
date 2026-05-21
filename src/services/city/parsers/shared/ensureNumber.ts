
/**
 * STABILIZZATORE DI TIPO: Number
 * Garantisce che l'output sia un numero valido.
 * Non esegue arrotondamenti o logiche di business.
 */
export const ensureNumber = (val: any, fallback = 0): number => {
    const n = Number(val);
    return isNaN(n) ? fallback : n;
};
