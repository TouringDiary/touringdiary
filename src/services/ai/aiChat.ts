import { aiGateway } from '@/services/ai/aiGateway';
import { aiErrorUserMessage, isAiEdgeError, AiEdgeError } from '@/services/ai/aiEdgeErrors';

/** Chat Hero / consulente — modulo senza generators (bootstrap Home). */
export const generateChatReply = async (userInput: string): Promise<string> => {
    try {
        return await aiGateway.generateChat(userInput);
    } catch (error) {
        console.error('[generateChatReply] Errore:', error);
        if (isAiEdgeError(error)) throw error;
        throw new AiEdgeError('AI_ERROR', aiErrorUserMessage(error, 'Spiacenti, il nostro consulente non è disponibile al momento.'));
    }
};
