
import { getAiClient, hasValidKey } from './aiClient';
import { Schema } from '../../types/ai';

// Pulisce l'output markdown dai blocchi di codice JSON e rimuove testo extra
export const cleanJsonOutput = (text: string): string => {
    if (!text) return "[]";

    let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    const firstSquare = clean.indexOf('[');
    const firstCurly = clean.indexOf('{');
    
    let startIndex = -1;
    let openChar = '';
    let closeChar = '';

    if (firstSquare === -1 && firstCurly === -1) return clean;
    
    if (firstSquare !== -1 && (firstCurly === -1 || firstSquare < firstCurly)) {
        startIndex = firstSquare;
        openChar = '[';
        closeChar = ']';
    } else {
        startIndex = firstCurly;
        openChar = '{';
        closeChar = '}';
    }

    let balance = 0;
    let inString = false;
    let escape = false;
    let endIndex = -1;

    for (let i = startIndex; i < clean.length; i++) {
        const char = clean[i];

        if (escape) {
            escape = false;
            continue;
        }

        if (char === '\\') {
            escape = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (char === openChar) {
                balance++;
            } else if (char === closeChar) {
                balance--;
                if (balance === 0) {
                    endIndex = i;
                    break;
                }
            }
        }
    }

    if (startIndex !== -1 && endIndex !== -1) {
        return clean.substring(startIndex, endIndex + 1);
    }

    if (startIndex !== -1) {
         return clean.substring(startIndex);
    }

    return clean;
};

// Wrapper per riprovare una funzione in caso di errore (Retry Logic) con gestione QUOTA
export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    // GUARD RAIL: Se la chiave non è valida, blocca tutto SUBITO.
    if (!hasValidKey) {
        console.warn("[AI Safety] Chiamata bloccata: API Key non configurata o non valida.");
        throw new Error("API_KEY_MISSING: Configura la chiave Google Gemini per usare l'AI.");
    }

    try {
        return await fn();
    } catch (e: any) {
        const errorString = JSON.stringify(e) + (e.message || '');
        
        const isQuotaError = errorString.includes('429') || errorString.toLowerCase().includes('quota') || errorString.toLowerCase().includes('resource_exhausted');
        
        if (isQuotaError) {
             throw new Error("QUOTA_EXCEEDED_DAILY");
        }
        
        if (errorString.includes('403') || errorString.includes('PERMISSION_DENIED')) {
             console.error("[AI Error] Permission Denied (403). Possible Tool/Schema Conflict.", e);
             throw new Error("API_KEY_ERROR_OR_CONFLICT"); 
        }
        
        if (errorString.includes('internal error') || errorString.includes('_.zB')) {
             console.warn("[AI Error] Internal SDK Error detected. Retrying...");
        }
        
        if (retries > 0) {
            const waitTime = delay;
            await new Promise(res => setTimeout(res, waitTime));
            const nextDelay = delay * 2;
            return withRetry(fn, retries - 1, nextDelay);
        }
        
        throw e;
    }
}

export async function generateStructuredResponse<T>(
    model: string,
    prompt: string,
    schema?: Schema
): Promise<T> {
    return withRetry(async () => {
        // USARE IL GETTER QUI
        const aiClient = getAiClient();
        
        const response = await aiClient.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema
            }
        });

        const rawJson = response.text || (schema?.type === 'ARRAY' ? "[]" : "{}");
        return JSON.parse(cleanJsonOutput(rawJson));
    });
}
