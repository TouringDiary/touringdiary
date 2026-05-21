import { aiGateway } from '@/services/ai/aiGateway';
// AI TEXT SERVICE (BARREL FILE)
// Questo file agisce come aggregatore per i generatori di testo e contenuto.
// Mantiene la compatibilità con gli import esistenti che puntano a 'aiText'.



export const generateChatReply = async (userInput: string): Promise<string> => {
    try {
        console.log('[aiText] calling generateChat with:', userInput);
        const responseText = await aiGateway.generateChat(userInput);
        console.log('[aiText] received responseText:', responseText);
        return responseText;
    } catch (error) {
        console.error('[generateChatReply] Errore:', error);
        return 'Spiacenti, il nostro consulente non è disponibile al momento. Riprova più tardi.';
    }
};

export * from './generators/cityContentGenerator';
export * from './generators/listGenerator';
export * from './generators/peopleGenerator';
export * from './generators/poiGenerator';