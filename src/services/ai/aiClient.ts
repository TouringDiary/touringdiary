
import { GoogleGenAI } from "@google/genai";
import { CONFIG } from '../../config/env';

// Flag pubblico per la UI (ora gestito lato server, assumiamo true per il client)
export const hasValidKey = true;

/**
 * Restituisce l'istanza GoogleGenAI.
 */
export const getAiClient = () => {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};
