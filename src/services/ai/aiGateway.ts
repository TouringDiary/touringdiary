import { supabaseProvider, AiRequestOptions } from './providers/supabaseProvider';

export class AiGateway {
    private provider = supabaseProvider;

    /**
     * Facade method compatibile con il vecchio formato Gemini { response: { text: () => string } }
     */
    async generateLegacy(payload: any): Promise<any> {
        let textPrompt = '';
        let systemInstruction = '';
        let files: any[] = [];
        
        // Estrai testo dal payload array legacy di Gemini
        const parts = payload.contents?.[0]?.parts || [];
        for (const p of parts) {
            if (p.text) textPrompt += p.text + '\n';
            if (p.inlineData) {
                files.push({ mimeType: p.inlineData.mimeType, data: p.inlineData.data });
            }
        }
        
        if (payload.systemInstruction?.parts?.[0]?.text) {
            systemInstruction = payload.systemInstruction.parts[0].text;
        }

        const options: AiRequestOptions = {
            model: payload.model || 'gemini-2.0-flash',
            systemInstruction,
            operationType: files.length > 0 ? 'vision' : 'task',
            files
        };

        const result = await this.provider.generate(textPrompt.trim(), options);
        
        return {
            response: {
                text: () => result
            }
        };
    }

    async generateText(prompt: string, options?: AiRequestOptions) {
        const textResult = await this.provider.generate(prompt, {
            ...options,
            operationType: options?.operationType || 'task'
        });
        
        // Retrocompatibilità
        return { response: { text: () => textResult } };
    }

    async generateChat(prompt: string): Promise<string> {
        const result = await this.provider.generate(prompt, { operationType: 'chat' });
        console.log(`[aiGateway] generateChat returning:`, result);
        return result;
    }

    async generateJson(prompt: string, systemInstruction?: string, model = 'gemini-2.0-pro') {
         return this.generateText(prompt, { 
             isJson: true, 
             systemInstruction,
             model,
             operationType: 'task'
         });
    }

    async generateVision(prompt: string, base64Images: { mimeType: string, data: string }[]) {
         return this.generateText(prompt, { 
             operationType: 'vision', 
             files: base64Images,
             model: 'gemini-2.0-pro'
         });
    }
}

export const aiGateway = new AiGateway();
