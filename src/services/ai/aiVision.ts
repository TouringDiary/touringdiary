import { aiGateway } from '@/services/ai/aiGateway';


import { withRetry, cleanJsonOutput } from './aiUtils';
import { getAiPrompt } from '../aiConfigService';
import { buildImageCaptionPrompt, buildTipIllustrationPrompt, buildImageSafetyPrompt } from '../../data/ai/prompts';
import { dataURLtoFile } from '../../utils/common';
import { uploadPublicMedia } from '../mediaService';

import { extractInlineDataFromRaw } from './aiLegacyPayload';

export const generateImageCaption = async (base64Image: string, context: string = ''): Promise<string> => {
    try {
        return await withRetry(async () => {
            let prompt = buildImageCaptionPrompt();
            try {
                 prompt = await getAiPrompt(
                    'vision_caption',
                    { context },
                    prompt
                );
            } catch (configError) {
                // Ignora errori di caricamento config
            }

            const base64Data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;

            const response = await aiGateway.generateLegacy({
                model: 'gemini-2.5-flash', 
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                        { text: prompt }
                    ]
                }
            }, { feature: 'vision' });

            const text =
                typeof response.text === 'string'
                    ? response.text
                    : response.response?.text?.();
            return text?.trim() || "Foto Community";
        });
    } catch (e) {
        console.warn("AI Caption Error (Handled):", e);
        return "Foto Community";
    }
};

export const generateTipIllustration = async (text: string): Promise<string | null> => {
    try {
        return await withRetry(async () => {
            const prompt = buildTipIllustrationPrompt(text);

            const response = await aiGateway.generateLegacy({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: {
                    imageConfig: {
                         aspectRatio: "1:1"
                    }
                }
            }, { feature: 'vision' });

            return extractInlineDataFromRaw(response.raw) ?? null;
        });
    } catch (e) {
        console.error("AI Generation Error:", e);
        return null;
    }
};

export const generateHistoricalPortrait = async (personName: string, role: string, cityName: string): Promise<string | null> => {
    const MODELS_TO_TRY = ['gemini-2.5-flash-image'];

    let dbPrompt = '';
    try {
        dbPrompt = await getAiPrompt(
            'vision_portrait_historical',
            { personName, role, cityName },
            `Genera un ritratto artistico (olio/affresco) di ${personName}, ${role} a ${cityName}. VISTA DI SPALLE O SILHOUETTE. VISO NON VISIBILE.`
        );
    } catch (e) {
        dbPrompt = `Genera un ritratto artistico di ${personName} a ${cityName}. Vista di spalle.`;
    }

    try {
        for (const model of MODELS_TO_TRY) {
            try {
                const response = await aiGateway.generateLegacy({
                    model: model,
                    contents: { parts: [{ text: dbPrompt }] },
                    config: {
                        imageConfig: {
                            aspectRatio: "3:4",
                        }
                    }
                }, { feature: 'vision' });

                const base64Data = extractInlineDataFromRaw(response.raw);
                if (base64Data) {
                    const file = dataURLtoFile(base64Data, `portrait_${personName.replace(/\s/g, '_')}_${Date.now()}.png`);
                    const publicUrl = await uploadPublicMedia(file, 'people_portraits');
                    if (publicUrl) return publicUrl;
                }
            } catch (e: unknown) {
                console.warn(`[AI Vision] Fallito con ${model}.`, e);
            }
        }
    } catch(e) {
        console.warn("AI Client not ready or invalid key");
    }

    return null;
};

export const analyzeImageSafety = async (base64Image: string): Promise<{ isSafe: boolean; reason?: string }> => {
    try {
        return await withRetry(async () => {
            const prompt = buildImageSafetyPrompt();
            const base64Data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;

            const response = await aiGateway.generateLegacy({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                        { text: prompt }
                    ]
                },
                config: { responseMimeType: 'application/json' }
            }, { feature: 'vision' });

            const text =
                typeof response.text === 'string'
                    ? response.text
                    : response.response?.text?.() ?? "{}";
            const json = JSON.parse(cleanJsonOutput(text.trim() || "{}"));
            
            return { 
                isSafe: json.isSafe === true, 
                reason: json.reason || "Contenuto non verificato"
            };
        });
    } catch (e) {
        return { isSafe: true, reason: "Verifica AI saltata (Offline/Errore)" };
    }
};
