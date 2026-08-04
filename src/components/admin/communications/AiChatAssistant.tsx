import { Send, X } from 'lucide-react';

import { useEffect, useMemo, useRef, useState } from 'react';
import { aiGateway } from '@/services/ai/aiGateway';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const AiChatAssistant = ({
  currentContext,
  onClose,
}: {
  currentContext: { subject?: string; body?: string; target?: string };
  onClose: () => void;
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Ciao! Sono il tuo editor personale. Come posso migliorare il messaggio che stai scrivendo?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const systemPrompt = useMemo(
    () => `Sei un esperto copywriter per app turistiche.
            CONTESTO ATTUALE:
            - Target: ${currentContext.target ?? ''}
            - Oggetto: "${currentContext.subject ?? ''}"
            - Corpo: "${currentContext.body ?? ''}"
            
            Aiuta l'utente a migliorare il messaggio. Rispondi in italiano.`,
    [currentContext],
  );

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const fullPrompt = `${systemPrompt}\n\nRICHIESTA UTENTE: ${userMsg}`;

      const response = await aiGateway.generateLegacy({
        model: 'gemini-2.0-pro',
        contents: fullPrompt,
      });

      setMessages((prev) => [
        ...prev,
        { role: 'model', text: response.text || 'Non ho capito, puoi riformulare?' },
      ]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setMessages((prev) => [...prev, { role: 'model', text: `Errore AI: ${message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 shadow-2xl w-80 md:w-96 shrink-0 absolute right-0 top-0 bottom-0 z-admin-modal animate-in slide-in-from-right-10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <h3 className="text-sm font-bold text-white">Assistente AI</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi assistente"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div
            key={`${msg.role}-${idx}`}
            className={`text-sm rounded-xl px-3 py-2 ${
              msg.role === 'user'
                ? 'bg-indigo-600/20 text-indigo-100 ml-6'
                : 'bg-slate-800 text-slate-200 mr-6'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="text-xs text-slate-500 px-1">L&apos;assistente sta scrivendo…</div>
        )}
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Chiedi modifiche..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
