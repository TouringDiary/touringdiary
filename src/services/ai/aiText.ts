import { aiGateway } from '@/services/ai/aiGateway';
import { aiErrorUserMessage, isAiEdgeError, AiEdgeError } from '@/services/ai/aiEdgeErrors';
// AI TEXT SERVICE (BARREL FILE)
// Questo file agisce come aggregatore per i generatori di testo e contenuto.
// Mantiene la compatibilità con gli import esistenti che puntano a 'aiText'.



export const generateChatReply = async (userInput: string): Promise<string> => {
    try {
        return await aiGateway.generateChat(userInput);
    } catch (error) {
        console.error('[generateChatReply] Errore:', error);
        if (isAiEdgeError(error)) throw error;
        throw new AiEdgeError('AI_ERROR', aiErrorUserMessage(error, 'Spiacenti, il nostro consulente non è disponibile al momento.'));
    }
};

export * from './generators/cityContentGenerator';
export * from './generators/listGenerator';
export * from './generators/peopleGenerator';
export * from './generators/poiGenerator';
