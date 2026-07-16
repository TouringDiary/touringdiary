
import { ensureArray } from '../shared/ensureArray';

/**
 * Utilities per lo storico permanente `generation_logs` / `generationLogs`.
 * - READ: parseLogs (normalizzazione da DB)
 * - WRITE: appendGenerationLogs (unico modo ammesso per aggiungere eventi)
 */

/** Normalizza array di stringhe (es: generation_logs) dal DB. */
export const parseLogs = (raw: unknown): string[] => {
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

/**
 * Aggiunge nuovi eventi allo storico esistente senza mai rimuovere o sostituire righe precedenti.
 * Regola di dominio: ogni pipeline AI deve usare questa funzione per persistere log.
 */
export const appendGenerationLogs = (
    existing: string[] | null | undefined,
    entries: string[] | null | undefined,
): string[] => {
    const base = existing ?? [];
    if (!entries?.length) {
        return [...base];
    }

    const validEntries = entries.filter(
        (entry): entry is string => typeof entry === 'string' && entry.length > 0,
    );
    if (!validEntries.length) {
        return [...base];
    }

    return [...base, ...validEntries];
};
