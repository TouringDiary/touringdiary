import { supabase } from '../../supabaseClient';
import { getGuestId } from '../../aiUsageService';
import { parseEdgeInvokeResponse, EdgeInvokeResult } from '../aiEdgeErrors';

export interface AiRequestOptions {
    model?: string;
    systemInstruction?: string;
    isJson?: boolean;
    files?: { mimeType: string, data: string }[];
    operationType?: 'chat' | 'task' | 'vision';
    /** Analytics/debug only — does not alter consume logic */
    feature?: string;
    /** Legacy Gemini config passthrough (edge-only) */
    generationConfig?: unknown;
    tools?: unknown;
    imageConfig?: unknown;
    responseSchema?: unknown;
}

export const supabaseProvider = {
    generate: async (prompt: string, options?: AiRequestOptions): Promise<EdgeInvokeResult> => {
        if (!prompt?.trim()) {
            throw new Error('Prompt AI vuoto: impossibile invocare il runtime edge.');
        }

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
                feature: options?.feature,
                generationConfig: options?.generationConfig,
                tools: options?.tools,
                imageConfig: options?.imageConfig,
                responseSchema: options?.responseSchema,
            }
        });

        return parseEdgeInvokeResponse(data, error);
    }
};
