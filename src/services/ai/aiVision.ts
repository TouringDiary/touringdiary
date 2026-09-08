import { aiGateway } from '@/services/ai/aiGateway';
import {
  buildImageCaptionPrompt,
  buildImageSafetyPrompt,
  buildTipIllustrationPrompt,
} from '../../data/ai/prompts';
import { dataURLtoFile } from '../../utils/common';
import { getAiPrompt } from '../aiConfigService';
import { uploadPublicMedia } from '../mediaService';
import { extractInlineDataFromRaw } from './aiLegacyPayload';
import { cleanJsonOutput, withRetry } from './aiUtils';

/** MIME from `data:(mime);base64,…`; raw base64 defaults to JPEG (historical community upload default). */
function resolveImageMimeType(base64Image: string): string {
  const trimmed = base64Image.trim();
  const match = /^data:([^;,]+)/i.exec(trimmed);
  if (match?.[1]) {
    const mime = match[1].toLowerCase();
    if (!mime.startsWith('image/')) {
      throw new Error(`MIME type '${mime}' is not a valid image format.`);
    }
    return mime;
  }
  
  const cleanPayload = extractBase64Payload(trimmed);
  if (!/^[A-Za-z0-9+/=\s]+$/.test(cleanPayload)) {
    throw new Error('Invalid Base64 payload structure.');
  }
  return 'image/jpeg';
}

function extractBase64Payload(base64Image: string): string {
  const trimmed = base64Image.trim();
  if (!trimmed) {
    throw new Error('Empty image input.');
  }
  const commaIndex = trimmed.indexOf(',');
  if (commaIndex !== -1 && trimmed.substring(0, commaIndex).includes('base64')) {
    const payload = trimmed.substring(commaIndex + 1).trim();
    if (!payload) {
      throw new Error('Empty Base64 payload.');
    }
    return payload;
  }
  return trimmed;
}

export const generateImageCaption = async (
  base64Image: string,
  context: string = '',
): Promise<string> => {
  try {
    return await withRetry(async () => {
      let prompt = buildImageCaptionPrompt();
      try {
        prompt = await getAiPrompt('vision_caption', { context }, prompt);
      } catch {
        // Ignora errori di caricamento config
      }

      const mimeType = resolveImageMimeType(base64Image);
      const base64Data = extractBase64Payload(base64Image);

      const response = await aiGateway.generateLegacy(
        {
          model: 'gemini-2.5-flash',
          contents: {
            parts: [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }],
          },
        },
        { feature: 'vision' },
      );

      const text = typeof response.text === 'string' ? response.text : response.response?.text?.();
      return text?.trim() || 'Foto Community';
    });
  } catch (e) {
    console.warn('AI Caption Error (Handled):', e);
    return 'Foto Community';
  }
};

export const generateTipIllustration = async (text: string): Promise<string | null> => {
  try {
    return await withRetry(async () => {
      const prompt = buildTipIllustrationPrompt(text);

      const response = await aiGateway.generateLegacy(
        {
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: prompt }] },
          config: {
            imageConfig: {
              aspectRatio: '1:1',
            },
          },
        },
        { feature: 'vision' },
      );

      return extractInlineDataFromRaw(response.raw) ?? null;
    });
  } catch (e) {
    console.error('AI Generation Error:', e);
    return null;
  }
};

export const generateHistoricalPortrait = async (
  personName: string,
  categoryLabel: string,
  cityName: string,
): Promise<string | null> => {
  let dbPrompt = '';
  try {
    // getAiPrompt replaces `{key}` literally. Domain vars: personName, categoryLabel, cityName.
    // `role` is NOT domain — isolated legacy alias of categoryLabel if DB still has `{role}`.
    dbPrompt = await getAiPrompt(
      'vision_portrait_historical',
      { personName, categoryLabel, role: categoryLabel, cityName },
      `Genera un ritratto artistico (olio/affresco) di ${personName}, ${categoryLabel} a ${cityName}. VISTA DI SPALLE O SILHOUETTE. VISO NON VISIBILE.`,
    );
  } catch {
    dbPrompt = `Genera un ritratto artistico di ${personName}, ${categoryLabel} a ${cityName}. Vista di spalle.`;
  }

  try {
    const response = await aiGateway.generateLegacy(
      {
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: dbPrompt }] },
        config: {
          imageConfig: {
            aspectRatio: '3:4',
          },
        },
      },
      { feature: 'vision' },
    );

    const base64Data = extractInlineDataFromRaw(response.raw);
    if (base64Data) {
      const file = dataURLtoFile(
        base64Data,
        `portrait_${personName.replace(/\s/g, '_')}_${Date.now()}.png`,
      );
      const publicUrl = await uploadPublicMedia(file, 'people_portraits');
      if (publicUrl) return publicUrl;
    }
  } catch (e) {
    console.warn('[AI Vision] generateHistoricalPortrait failed.', e);
  }

  return null;
};

export const analyzeImageSafety = async (
  base64Image: string,
): Promise<{ isSafe: boolean; reason?: string }> => {
  try {
    return await withRetry(async () => {
      const prompt = buildImageSafetyPrompt();
      const mimeType = resolveImageMimeType(base64Image);
      const base64Data = extractBase64Payload(base64Image);

      const response = await aiGateway.generateLegacy(
        {
          model: 'gemini-2.5-flash',
          contents: {
            parts: [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }],
          },
          config: { responseMimeType: 'application/json' },
        },
        { feature: 'vision' },
      );

      const text =
        typeof response.text === 'string' ? response.text : (response.response?.text?.() ?? '{}');
      
      let isSafe = false;
      let reason = 'Verifica AI non disponibile';
      
      try {
        const parsed: unknown = JSON.parse(cleanJsonOutput(text.trim() || '{}'));
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          const record = parsed as Record<string, unknown>;
          isSafe = record.isSafe === true;
          if (typeof record.reason === 'string' && record.reason.trim() !== '') {
            reason = record.reason.trim();
          } else {
            reason = isSafe ? 'Immagine sicura' : 'Contenuto non sicuro o inappropriato';
          }
        }
      } catch (parseErr) {
        console.warn('[AI Vision] Failed to parse safety JSON:', parseErr);
      }

      return { isSafe, reason };
    });
  } catch (err) {
    // Fail-closed: se la verifica fallisce o non è disponibile, restituiamo isSafe = false per bloccare l'approvazione automatica.
    console.error('[AI Vision] analyzeImageSafety failed:', err);
    return { isSafe: false, reason: 'Verifica AI non disponibile (Offline/Errore)' };
  }
};
