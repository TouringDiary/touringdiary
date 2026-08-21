/**
 * Utility per gestire in modo sicuro tipi di dati incerti provenienti da API o Context.
 * Previene crash comuni come "Cannot read properties of undefined (reading 'length')".
 */

/**
 * Assicura che l'input sia un array. Se non lo è, restituisce un array vuoto.
 */
export const safeArray = <T>(input: unknown): T[] => {
  if (Array.isArray(input)) return input;
  return [];
};

/**
 * Assicura che l'input sia un oggetto valido (non null). Se non lo è, restituisce un oggetto vuoto.
 */
export const safeObject = <T extends object>(input: unknown): T => {
  if (input && typeof input === 'object' && !Array.isArray(input)) return input as T;
  return {} as T;
};

/**
 * Utility per estrarre una proprietà stringa in modo sicuro.
 */
export const safeString = (input: unknown, fallback: string = ''): string => {
  if (typeof input === 'string') return input;
  return fallback;
};
