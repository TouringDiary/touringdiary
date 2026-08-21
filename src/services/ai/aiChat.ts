import { AiEdgeError, aiErrorUserMessage, isAiEdgeError } from '@/services/ai/aiEdgeErrors';
import { aiGateway } from '@/services/ai/aiGateway';

/** Chat Hero / consulente — modulo senza generators (bootstrap Home). */
export const generateChatReply = async (userInput: string): Promise<string> => {
  try {
    return await aiGateway.generateChat(userInput);
  } catch (error) {
    console.error('[generateChatReply] Errore:', error);
    if (isAiEdgeError(error)) throw error;
    throw new AiEdgeError(
      'AI_ERROR',
      aiErrorUserMessage(error, 'Spiacenti, il nostro consulente non è disponibile al momento.'),
    );
  }
};
