import { GoogleGenAI } from "@google/genai";

// 🔑 legge la key UNA volta
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// ✅ flag reale
export const hasValidKey = !!apiKey;

/**
 * Factory per ottenere il client AI
 */
export const getAiClient = () => {
    if (!apiKey) {
        console.error("❌ GEMINI API KEY MISSING", import.meta.env);
        throw new Error("[TouringDiary] VITE_GEMINI_API_KEY mancante");
    }

    return new GoogleGenAI({
        apiKey: apiKey
    });
};