import { supabase } from '../../supabaseClient';
import { getGuestId } from '../../aiUsageService';

export interface AiRequestOptions {
    model?: string;
    systemInstruction?: string;
    isJson?: boolean;
    files?: { mimeType: string, data: string }[];
    operationType?: 'chat' | 'task' | 'vision';
}

export const supabaseProvider = {
    generate: async (prompt: string, options?: AiRequestOptions): Promise<string> => {
        // Edge functions mapping
        let edgeFunction = 'gemini-task';
        if (options?.operationType === 'chat') {
            edgeFunction = 'gemini-chat';
        }

        const { data: { session } } = await supabase.auth.getSession();
        const guestId = session?.user?.id ? undefined : getGuestId();

        const { data, error } = await supabase.functions.invoke(edgeFunction, {
            body: { 
                prompt,
                modelId: options?.model || 'gemini-2.0-flash',
                systemInstruction: options?.systemInstruction,
                isJson: options?.isJson,
                files: options?.files,
                guestId,
            }
        });

        if (error) {
            console.error(`[SupabaseProvider] Errore API invoking ${edgeFunction}:`, error);
            // Handle native edge function generic errors
            throw error;
        }

        console.log(`[SupabaseProvider] RAW Data from edge:`, data);

        return data?.reply ?? '';
    }
};
