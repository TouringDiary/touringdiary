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

function isValidBase64(str: string): boolean {
  const clean = str.replace(/\s+/g, '');
  if (!clean) return false;
  if (clean.length % 4 !== 0) return false;

  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  if (!base64Regex.test(clean)) return false;

  const firstEqualIdx = clean.indexOf('=');
  if (firstEqualIdx !== -1) {
    if (firstEqualIdx < clean.length - 2) {
      return false;
    }
    if (clean.length - firstEqualIdx === 2 && clean[clean.length - 1] !== '=') {
      return false;
    }
  }

  return true;
}

/** MIME from `data:(mime);base64,…`; raw base64 defaults to JPEG (historical community upload default). */
function resolveImageMimeType(base64Image: string): string {
  const trimmed = base64Image.trim();
  if (trimmed.toLowerCase().startsWith('data:')) {
    const match = /^data:([^;,]+);base64,/i.exec(trimmed);
    if (!match) {
      throw new Error('Data URL is missing ";base64," or has an invalid structure.');
    }
    const mime = match[1].toLowerCase();
    if (!mime.startsWith('image/')) {
      throw new Error(`MIME type '${mime}' is not a valid image format.`);
    }
    return mime;
  }

  const cleanPayload = extractBase64Payload(trimmed);
  if (!isValidBase64(cleanPayload)) {
    throw new Error('Invalid Base64 payload structure.');
  }
  return 'image/jpeg';
}

function extractBase64Payload(base64Image: string): string {
  const trimmed = base64Image.trim();
  if (!trimmed) {
    throw new Error('Empty image input.');
  }
  if (trimmed.toLowerCase().startsWith('data:')) {
    const match = /^data:([^;,]+);base64,(.*)$/is.exec(trimmed);
    if (!match) {
      throw new Error('Data URL is missing ";base64," or has an invalid structure.');
    }
    const payload = match[2].trim();
    if (!payload) {
      throw new Error('Empty Base64 payload.');
    }
    if (!isValidBase64(payload)) {
      throw new Error('Invalid Base64 payload structure.');
    }
    return payload;
  }

  if (!isValidBase64(trimmed)) {
    throw new Error('Invalid Base64 payload structure.');
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
      { personName, categoryLabel, cityName },
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
