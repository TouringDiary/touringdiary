// AI TEXT SERVICE (BARREL FILE)
// Questo file agisce come aggregatore per i generatori di testo e contenuto.
// Mantiene la compatibilità con gli import esistenti che puntano a 'aiText'.

import { getAiClient } from './aiClient';

export const generateChatReply = async (userInput: string): Promise<string> => {
    // Costruzione del prompt tramite template string per maggiore chiarezza.
    const fullPrompt = `Sei l'assistente virtuale ufficiale del sito web Touring Diary.
Il tuo tono deve essere caldo, amichevole e professionale.
Rispondi sempre e solo in italiano.
La tua risposta deve avere una lunghezza massima di 80 parole.

ISTRUZIONE SPECIALE: Se un utente chiede di creare un itinerario, di pianificare un viaggio o attività simili, non provare a crearlo tu. Suggerisci invece, in modo gentile, di usare le funzioni dedicate del sito come il "Magic Planner" o il "Diario di Viaggio".

Domanda Utente: "${userInput}"

Risposta:`;

    try {
        const ai = getAiClient();
        
        const result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ parts: [{ text: fullPrompt }] }]
        });

        // 🔥 FIX MINIMO: protezione runtime
        const textResponse = result?.response?.text?.();

        if (textResponse) {
            return textResponse;
        }
        
        throw new Error('La risposta dell\'AI è vuota o non valida.');

    } catch (error) {
        console.error('[generateChatReply] Errore:', error);
        return 'Spiacenti, il nostro consulente non è disponibile al momento. Riprova più tardi.';
    }
};

export * from './generators/cityContentGenerator';
export * from './generators/listGenerator';
export * from './generators/peopleGenerator';
export * from './generators/poiGenerator';