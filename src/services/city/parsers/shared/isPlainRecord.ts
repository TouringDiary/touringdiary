/**
 * Type guard: oggetto plain (non null, non array).
 * Usato dai parser City per accettare ingressi grezzi tipizzati come unknown.
 */
export function isPlainRecord(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw);
}
