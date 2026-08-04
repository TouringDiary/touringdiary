
import { supabase } from './supabaseClient';
import { DatabaseAiConfigInsert } from '../types/database';

/**
 * Cache locale in-memory dei prompt risolti per chiave.
 * Nessuna invalidazione cross-tab / cross-session / TTL: un valore resta finché
 * il modulo resta caricato o viene sovrascritto da un successivo fetch/save locale.
 */
const promptCache: Record<string, string> = {};

export interface AiPreset {
    name: string;
    text: string;
}

/** Parser runtime minimale: scarta elementi che non rispettano `{ name, text: string }`. */
function parseAiPresets(raw: unknown): AiPreset[] {
    if (!Array.isArray(raw)) return [];
    const presets: AiPreset[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
        const row = item as Record<string, unknown>;
        if (typeof row.name !== 'string' || typeof row.text !== 'string') continue;
        presets.push({ name: row.name, text: row.text });
    }
    return presets;
}

/**
 * Recupera un prompt dal DB e sostituisce le variabili.
 * @param key La chiave univoca del prompt nel DB (es. 'city_general')
 * @param variables Oggetto chiave-valore per le sostituzioni (es. { cityName: 'Napoli' })
 * @param fallback Il testo di default se il DB fallisce (Hardcoded safety)
 */
export const getAiPrompt = async (
    key: string, 
    variables: Record<string, string | number> = {},
    fallback: string = ''
): Promise<string> => {
    let template = fallback;

    // 1. Check Cache (Hit veloce)
    if (promptCache[key]) {
        template = promptCache[key];
    } else {
        // 2. Fetch DB (Miss cache)
        try {
            const { data, error } = await supabase
                .from('ai_configs')
                .select('selected')
                .eq('key', key)
                .limit(1);

            if (data && data.length > 0 && data[0].selected && data[0].selected.length > 0) {
                // Unisce le parti selezionate del prompt (se è un array multiriga)
                const fullPrompt = data[0].selected.join(' ');
                promptCache[key] = fullPrompt;
                template = fullPrompt;
            } else if (error) {
                 // Se non trovato nel DB, usa il fallback ma logga solo in dev
                 // console.warn(`[AI Config] Prompt key "${key}" not found in DB. Using fallback.`);
            }
        } catch (e) {
            console.error("[AI Config] Network error:", e);
        }
    }

    // 3. Variable Replacement
    // Sostituisce {key} con value
    let finalPrompt = template;
    Object.entries(variables).forEach(([varKey, varValue]) => {
        const regex = new RegExp(`{${varKey}}`, 'g');
        finalPrompt = finalPrompt.replace(regex, String(varValue));
    });

    return finalPrompt;
};

export const getAiConfig = async (key: string): Promise<{ prompts: string[], selected: string[], presets: AiPreset[] } | null> => {
    try {
        const { data, error } = await supabase
            .from('ai_configs')
            .select('*')
            .eq('key', key)
            .limit(1);

        if (error || !data || data.length === 0) return null;

        return {
            prompts: data[0].prompts || [],
            selected: data[0].selected || [],
            presets: parseAiPresets(data[0].presets)
        };
    } catch (e) {
        console.error("Error fetching AI config:", e);
        return null;
    }
};

export const saveAiConfig = async (key: string, prompts: string[], selected: string[], presets?: AiPreset[]): Promise<void> => {
    try {
        const payload: DatabaseAiConfigInsert = {
            key,
            prompts,
            selected,
            updated_at: new Date().toISOString()
        };

        if (presets) {
            payload.presets = presets.map(p => ({ ...p }));
        }

        const { error } = await supabase
            .from('ai_configs')
            .upsert(payload);

        if (error) throw error;
        
        // Aggiorna cache locale immediata con il `selected` appena inviato.
        // Non garantisce allineamento al valore persistito se trigger DB o writer
        // concorrenti modificano la riga dopo l'upsert.
        promptCache[key] = selected.join(' ');
        
    } catch (e) {
        console.error("Error saving AI config:", e);
    }
};
