import { supabaseProvider, AiRequestOptions } from './providers/supabaseProvider';
import { extractLegacyPayload, wrapLegacyResponse } from './aiLegacyPayload';

export class AiGateway {
    private provider = supabaseProvider;

    private wrapTextResult(text: string, raw?: unknown) {
        return wrapLegacyResponse(text, raw);
    }

    /**
     * Facade method compatibile con il vecchio formato Gemini { response: { text: () => string } }
     * e con i caller che leggono `response.text` (FASE 2A).
     */
    async generateLegacy(payload: Record<string, unknown>, options?: Pick<AiRequestOptions, 'feature'>): Promise<ReturnType<typeof wrapLegacyResponse>> {
        const extracted = extractLegacyPayload(payload);

        if (!extracted.textPrompt) {
            throw new Error('Prompt AI vuoto: payload.contents non interpretabile.');
        }

        const requestOptions: AiRequestOptions = {
            model: (payload.model as string) || 'gemini-2.0-flash',
            systemInstruction: extracted.systemInstruction,
            isJson: extracted.isJson,
            operationType: extracted.files.length > 0 ? 'vision' : 'task',
            files: extracted.files,
            feature: options?.feature ?? 'admin_generate',
            generationConfig: extracted.generationConfig,
            tools: extracted.tools,
            imageConfig: extracted.imageConfig,
            responseSchema: extracted.responseSchema,
        };

        const result = await this.provider.generate(extracted.textPrompt, requestOptions);
        return this.wrapTextResult(result.text, result.raw);
    }

    async generateText(prompt: string, options?: AiRequestOptions) {
        const result = await this.provider.generate(prompt, {
            ...options,
            operationType: options?.operationType || 'task',
        });
        return this.wrapTextResult(result.text, result.raw);
    }

    async generateChat(prompt: string): Promise<string> {
        const result = await this.provider.generate(prompt, {
            operationType: 'chat',
            feature: 'hero_chat',
        });
        return result.text;
    }

    async generateJson(prompt: string, systemInstruction?: string, model = 'gemini-2.0-pro') {
        return this.generateText(prompt, {
            isJson: true,
            systemInstruction,
            model,
            operationType: 'task',
            feature: 'admin_generate',
        });
    }

    async generateVision(prompt: string, base64Images: { mimeType: string, data: string }[]) {
        return this.generateText(prompt, {
            operationType: 'vision',
            files: base64Images,
            model: 'gemini-2.0-pro',
            feature: 'vision',
        });
    }
}

export const aiGateway = new AiGateway();
