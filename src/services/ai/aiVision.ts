
import { getAiClient } from './aiClient';
import { withRetry, cleanJsonOutput } from './aiUtils';
import { getAiPrompt } from '../aiConfigService';
import { buildImageCaptionPrompt, buildTipIllustrationPrompt, buildImageSafetyPrompt } from '../../data/ai/prompts';
import { dataURLtoFile } from '../../utils/common';
import { uploadPublicMedia } from '../mediaService';

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
            
            // USE GETTER
            const aiClient = getAiClient();

            const response = await aiClient.models.generateContent({
                model: 'gemini-2.5-flash', 
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                        { text: prompt }
                    ]
                }
            });

            return response.text?.trim() || "Foto Community";
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
            const aiClient = getAiClient();

            const response = await aiClient.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: {
                    imageConfig: {
                         aspectRatio: "1:1"
                    }
                }
            });

            if (response.candidates && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
            return null;
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

    // Qui non usiamo withRetry globale per gestire il loop modelli custom, ma chiamiamo getAiClient
    try {
        const aiClient = getAiClient(); // Throws if invalid
        
        for (const model of MODELS_TO_TRY) {
            try {
                const response = await aiClient.models.generateContent({
                    model: model,
                    contents: { parts: [{ text: dbPrompt }] },
                    config: {
                        imageConfig: {
                            aspectRatio: "3:4",
                        }
                    }
                });

                let base64Data = '';
                if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            base64Data = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                            break;
                        }
                    }
                }
                
                if (base64Data) {
                    const file = dataURLtoFile(base64Data, `portrait_${personName.replace(/\s/g, '_')}_${Date.now()}.png`);
                    const publicUrl = await uploadPublicMedia(file, 'people_portraits');
                    if (publicUrl) return publicUrl;
                }
            } catch (e: any) {
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
            
            const aiClient = getAiClient();

            const response = await aiClient.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                        { text: prompt }
                    ]
                },
                config: { responseMimeType: 'application/json' }
            });

            const text = response.text?.trim() || "{}";
            const json = JSON.parse(cleanJsonOutput(text));
            
            return { 
                isSafe: json.isSafe === true, 
                reason: json.reason || "Contenuto non verificato"
            };
        });
    } catch (e) {
        return { isSafe: true, reason: "Verifica AI saltata (Offline/Errore)" };
    }
};
