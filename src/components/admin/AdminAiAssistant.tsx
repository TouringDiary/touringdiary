
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot } from 'lucide-react';
import { getAiClient } from '../../services/ai/aiClient';

interface Props {
    section: string;
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

export const AdminPageAiAssistant = ({ section }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(isOpen && messages.length === 0) {
            setMessages([{
                role: 'model',
                text: `Ciao! Sono il tuo assistente senior per la sezione **${section}**. Come posso aiutarti oggi?`
            }]);
        }
    }, [section, isOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const ai = getAiClient();
            const prompt = `Sei un assistente senior amministrativo per l'app "Touring Diary". 
            L'utente si trova nella sezione admin: "${section}".
            Aiutalo a gestire i dati, capire le metriche o risolvere problemi in modo professionale.
            
            Domanda Utente: ${userMsg}`;

            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview', 
                contents: prompt,
            });

            setMessages(prev => [...prev, { role: 'model', text: response.text || "Non ho capito, puoi ripetere?" }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'model', text: `Errore AI: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border
                    ${isOpen 
                        ? 'bg-white text-indigo-600 rotate-180 scale-110 border-indigo-200 ring-4 ring-indigo-500/20' 
                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-400/50 hover:scale-110'
                    }
                `}
                title="AI Admin Helper"
            >
                <Sparkles className={`w-5 h-5 ${isOpen ? 'fill-indigo-600' : 'fill-white'}`} />
            </button>

            {isOpen && (
                <div className="absolute top-14 left-0 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-80 md:w-96 h-[400px] flex flex-col overflow-hidden animate-in zoom-in-95 origin-top-left">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2 text-white">
                            <Bot className="w-5 h-5"/>
                            <span className="font-bold text-sm uppercase tracking-wide">AI Admin Support (Pro)</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors"><X className="w-4 h-4"/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950" ref={scrollRef}>
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                                    <p>{m.text}</p>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start"><div className="bg-slate-800 rounded-xl px-4 py-3 border border-slate-700"><Sparkles className="w-4 h-4 text-indigo-400 animate-pulse"/></div></div>
                        )}
                    </div>
                    <div className="p-3 bg-slate-900 border-t border-slate-800">
                        <div className="flex gap-2 relative">
                            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Chiedi all'AI Pro..." className="flex-1 bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:border-indigo-500 outline-none"/>
                            <button onClick={handleSend} disabled={!input.trim() || loading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg"><Send className="w-3.5 h-3.5"/></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
