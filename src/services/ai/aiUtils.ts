    import { aiGateway } from '@/services/ai/aiGateway';
    import { AiEdgeError } from '@/services/ai/aiEdgeErrors';

    import { Schema } from '../../types/ai';

    // In questa architettura (Supabase Edge Functions), la validazione della chiave avviene sul server.
    // hasValidKey è un flag di sicurezza per prevenire chiamate a vuoto se il client non è configurato.
    const hasValidKey = !!import.meta.env.VITE_USE_AI;


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

    /**
     * Edge-backed AI: one invoke = one consume (Gemini retries run inside gemini-* edge only).
     * Default retries = 0 to prevent multi-consume on client re-invoke.
     */
    export const EDGE_INVOKE_RETRIES = 0;

    // Wrapper per riprovare una funzione in caso di errore (Retry Logic) con gestione QUOTA
    export async function withRetry<T>(fn: () => Promise<T>, retries = EDGE_INVOKE_RETRIES, delay = 2000): Promise<T> {
        // GUARD RAIL: Se la chiave non è valida, blocca tutto SUBITO.
        if (!hasValidKey) {
            console.warn("[AI Safety] Chiamata bloccata: API Key non configurata o non valida.");
            throw new Error("API_KEY_MISSING: Configura la chiave Google Gemini per usare l'AI.");
        }

        try {
            return await fn();
        } catch (e: unknown) {
            if (e instanceof AiEdgeError) throw e;

            const errorMessage =
                e instanceof Error
                    ? e.message
                    : String(e);
            const errorLower = errorMessage.toLowerCase();

            const isQuotaError = errorMessage.includes('429') || errorLower.includes('quota') || errorLower.includes('resource_exhausted');

            if (isQuotaError) {
                throw new Error("QUOTA_EXCEEDED_DAILY");
            }

            if (errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED')) {
                console.error("[AI Error] Permission Denied (403). Possible Tool/Schema Conflict.", e);
                throw new Error("API_KEY_ERROR_OR_CONFLICT");
            }

            if (errorLower.includes('internal error') || errorMessage.includes('_.zB')) {
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
        schema?: Schema,
        feature = 'task'
    ): Promise<T> {
        return withRetry(async () => {
            const response = await aiGateway.generateLegacy(
                {
                    model,
                    contents: prompt,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: schema
                    }
                },
                { feature }
            );

            const rawJson =
                typeof response.text === 'string'
                    ? response.text
                    : response.response?.text?.();
            if (!rawJson?.trim()) {
                throw new AiEdgeError('MALFORMED_RESPONSE', 'L\'AI ha restituito una risposta JSON vuota.');
            }

            try {
                return JSON.parse(cleanJsonOutput(rawJson)) as T;
            } catch {
                throw new AiEdgeError('MALFORMED_RESPONSE', 'Risposta AI non parsabile come JSON.');
            }
        });
    }
