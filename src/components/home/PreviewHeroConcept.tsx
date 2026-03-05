
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Bot, Send, Sparkles, Loader2 } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { generateCitySuggestion } from '../../services/ai';
import { useDynamicContent } from '../../hooks/useDynamicContent';
import { getGlobalImage } from '../../services/settingsService';

export const PreviewHeroConcept = () => {
    // --- DESIGN SYSTEM HOOKS ---
    // Titolo e Immagine collegati al DB Admin
    const heroTitleConfig = useDynamicContent('hero_label');
    const heroImage = getGlobalImage('hero');
    
    // --- STATO AI ---
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Rileva Mobile per eventuali logiche responsive non-CSS
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const handleAiSubmit = async () => {
        if (!aiQuery.trim()) return;
        setIsAiLoading(true);
        try {
            const response = await generateCitySuggestion(aiQuery);
            setAiResponse(response);
        } catch (error) {
            setAiResponse("Ciao! Sono pronto ad aiutarti a pianificare il viaggio perfetto.");
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="relative w-full h-[380px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 group bg-[#020617]">
            
            {/* 1. SFONDO DINAMICO */}
            <div className="absolute inset-0">
                <img 
                    src={heroImage} 
                    alt="Travel Concept" 
                    className="w-full h-full object-cover object-center opacity-80"
                    loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/40 to-[#020617]/90"></div>
            </div>

            {/* 2. CONTENUTO GRIGLIA */}
            <div className="absolute inset-0 z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 md:p-8 items-center">
                
                {/* SINISTRA: Logo Dinamico + Titolo Dinamico */}
                <div className="lg:col-span-7 flex flex-col justify-center h-full space-y-6">
                    
                    <div>
                         <div className="mb-2 opacity-80 scale-90 origin-left">
                            <BrandLogo variant="light" />
                        </div>
                        {/* TITOLO CONTROLLATO DA ADMIN (DB) */}
                        {/* La classe e il testo vengono iniettati dall'hook */}
                        <h1 className={`${heroTitleConfig.style} drop-shadow-xl whitespace-pre-line`}>
                            {heroTitleConfig.text || "Il mondo in una pagina.\nScrivi la tua storia."}
                        </h1>
                    </div>

                    {/* Barra di Ricerca */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-1.5 rounded-2xl flex items-center shadow-2xl max-w-xl">
                        <div className="flex-1 flex items-center px-3 border-r border-white/10">
                            <MapPin className="w-4 h-4 text-slate-300 mr-2"/>
                            <input type="text" placeholder="Dove vuoi andare?" className="bg-transparent w-full text-white text-sm placeholder:text-slate-400 outline-none font-medium"/>
                        </div>
                        <div className="w-32 flex items-center px-3 hidden md:flex">
                            <Calendar className="w-4 h-4 text-slate-300 mr-2"/>
                            <span className="text-slate-400 text-xs">Quando?</span>
                        </div>
                        <button className="bg-amber-500 hover:bg-amber-400 text-slate-900 p-3 rounded-xl transition-all shadow-lg">
                            <Search className="w-5 h-5 font-bold"/>
                        </button>
                    </div>
                </div>

                {/* DESTRA: AI Widget */}
                <div className="lg:col-span-5 h-full flex flex-col justify-center">
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl h-[320px] flex flex-col relative overflow-hidden group/ai">
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-purple-600 rounded-lg shadow-lg shadow-purple-900/50">
                                    <Bot className="w-4 h-4 text-white"/>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm leading-none">Travel Assistant</h3>
                                    <p className="text-[10px] text-slate-400">Powered by Gemini AI</p>
                                </div>
                            </div>
                            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse"/>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar mb-3 bg-black/20 rounded-xl p-3 border border-white/5 text-xs text-slate-300 leading-relaxed font-medium">
                            {isAiLoading ? (
                                <div className="flex items-center gap-2 text-purple-400">
                                    <Loader2 className="w-4 h-4 animate-spin"/> Sto pensando...
                                </div>
                            ) : aiResponse ? (
                                <p className="animate-in fade-in">{aiResponse}</p>
                            ) : (
                                <p className="italic opacity-70">
                                    "Ciao! Sono il tuo assistente. Chiedimi consigli su itinerari, piatti tipici o mete nascoste in Campania..."
                                </p>
                            )}
                        </div>

                        <div className="relative">
                            <input 
                                value={aiQuery}
                                onChange={(e) => setAiQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAiSubmit()}
                                placeholder="Chiedi qualcosa..." 
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white text-xs focus:border-purple-500 outline-none transition-colors"
                            />
                            <button 
                                onClick={handleAiSubmit}
                                disabled={!aiQuery.trim() || isAiLoading}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all disabled:opacity-50"
                            >
                                <Send className="w-3.5 h-3.5"/>
                            </button>
                        </div>

                    </div>
                </div>

            </div>
            
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-white/10 to-transparent pointer-events-none"></div>
        </div>
    );
};
