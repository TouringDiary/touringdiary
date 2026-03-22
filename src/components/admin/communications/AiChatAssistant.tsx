
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Sparkles, Copy, Loader2, RefreshCw } from 'lucide-react';
import { getAiClient } from '../../../services/ai/aiClient';

// ... (INTERFACES)

export const AiChatAssistant = ({ currentContext, onApply, onClose }: { currentContext: any, onApply: any, onClose: any }) => {
    const [messages, setMessages] = useState<any[]>([
        { role: 'model', text: "Ciao! Sono il tuo editor personale. Come posso migliorare il messaggio che stai scrivendo?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsLoading(true);

        try {
            const ai = getAiClient();
            
            const systemPrompt = `Sei un esperto copywriter per app turistiche.
            CONTESTO ATTUALE:
            - Target: ${currentContext.target}
            - Oggetto: "${currentContext.subject}"
            - Corpo: "${currentContext.body}"
            
            Aiuta l'utente a migliorare il messaggio. Rispondi in italiano.`;

            const fullPrompt = `${systemPrompt}\n\nRICHIESTA UTENTE: ${userMsg}`;

            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: fullPrompt,
            });

            setMessages(prev => [...prev, { role: 'model', text: response.text || "Non ho capito, puoi riformulare?" }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'model', text: `Errore AI: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    // ... (UI RENDERING)
    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 shadow-2xl w-80 md:w-96 shrink-0 absolute right-0 top-0 bottom-0 z-50 animate-in slide-in-from-right-10">
             {/* ... */}
             <div className="p-3 border-t border-slate-800 bg-slate-950">
                <div className="flex gap-2">
                    <input 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Chiedi modifiche..." 
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors">
                        <Send className="w-4 h-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};
