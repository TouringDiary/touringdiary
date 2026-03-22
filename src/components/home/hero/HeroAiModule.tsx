
import React, { useState, useEffect } from 'react';
import { Bot, ChevronUp, ChevronDown, Loader2, MessageCircle, Send } from 'lucide-react';
import { useDynamicStyles } from '../../../hooks/useDynamicStyles';
import { getCachedSetting } from '../../../services/settingsService';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { generateCitySuggestion } from '../../../services/ai';

interface HeroAiModuleProps {
    // State
    isAiExpanded: boolean;
    isAiLoading: boolean;
    aiResponse: string;
    typingText: string;
    aiQuery: string;

    // Handlers
    setIsAiExpanded: (v: boolean) => void;
    setAiQuery: (v: string) => void;
    setAiResponse: (v: string) => void;
    handleAiSubmit: (query?: string) => void;
}

export const HeroAiModule = (props: HeroAiModuleProps) => {
    // Rilevamento Mobile per stili dinamici locali
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    
    // Load AI Background from centralized service
    const bgImage = getCachedSetting('ai_box');

    const aiTitleStyle = useDynamicStyles('ai_title', isMobile);

    return (
        <div id="tour-ai-button" className={`col-span-12 lg:col-span-5 relative rounded-2xl border border-slate-800 bg-slate-900 p-4 flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${!props.isAiExpanded ? 'h-auto' : 'h-[30rem] lg:h-full'}`}>
            
            {/* OPTIONAL BACKGROUND */}
            {bgImage && (
                <div className="absolute inset-0 pointer-events-none">
                     <ImageWithFallback 
                        src={bgImage} 
                        alt="AI Background" 
                        className="w-full h-full object-cover opacity-40 grayscale-[20%]"
                        priority={false} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent"></div>
                </div>
            )}
            
            <div 
                className="flex items-center justify-between mb-2 shrink-0 h-8 cursor-pointer lg:cursor-default relative z-10"
                onClick={() => props.setIsAiExpanded(!props.isAiExpanded)}
            >
                <div className="flex items-center gap-3">
                     <div className="w-1.5 h-8 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                    <h3 className={aiTitleStyle}>Il Tuo Consulente</h3>
                </div>
                <div className="flex items-center gap-2">
                    <Bot className="w-6 h-6 text-purple-500 animate-pulse"/>
                    <div className="lg:hidden p-1.5 bg-slate-800/50 rounded-full border border-white/10 text-white backdrop-blur-sm">
                         {props.isAiExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                    </div>
                </div>
            </div>

            <div className={`relative z-10 flex-1 flex flex-col min-h-0 justify-between mt-2 ${props.isAiExpanded ? 'flex' : 'hidden lg:flex'}`}>
                {props.isAiLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                        <Loader2 className="w-10 h-10 animate-spin text-purple-500"/>
                        <span className="text-xs font-mono animate-pulse text-purple-300 uppercase tracking-widest">Elaborazione...</span>
                    </div>
                ) : props.aiResponse ? (
                    <div className="flex-1 flex flex-col h-full animate-in slide-in-from-bottom-2">
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mb-3">
                            <div className="bg-slate-950/80 p-4 rounded-xl border border-purple-500/20 text-sm text-slate-200 leading-relaxed shadow-inner backdrop-blur-md">
                                {props.aiResponse}
                            </div>
                        </div>
                        <button onClick={() => { props.setAiResponse(''); props.setAiQuery(''); }} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-slate-700 flex items-center justify-center gap-2 shadow-lg">
                            <MessageCircle className="w-4 h-4 text-purple-500"/> Nuova Domanda
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 flex flex-col justify-start mb-3 overflow-hidden">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[9px] text-purple-400 font-bold uppercase tracking-widest flex items-center gap-1.5 animate-pulse bg-purple-900/10 px-2 py-0.5 rounded border border-purple-500/20 backdrop-blur-sm">
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full inline-block"></span>
                                    Sta scrivendo...
                                </span>
                            </div>
                            <div 
                                onClick={() => props.handleAiSubmit(props.typingText)}
                                className="bg-slate-950/60 border border-slate-800/60 hover:border-purple-500/50 rounded-xl p-4 flex-1 cursor-pointer group transition-all relative overflow-hidden shadow-inner backdrop-blur-sm"
                            >
                                <p className="text-slate-300 font-medium text-sm leading-relaxed font-mono h-full overflow-hidden">
                                    {props.typingText}
                                    <span className="w-0.5 h-4 bg-purple-500 inline-block ml-0.5 animate-pulse translate-y-0.5"></span>
                                </p>
                                
                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[9px] font-bold text-purple-400 uppercase bg-slate-900 px-3 py-1.5 rounded-full border border-purple-500/30 shadow-lg">
                                    <MessageCircle className="w-3 h-3"/> Clicca per chiedere
                                </div>
                            </div>
                        </div>

                        <div className="relative shrink-0">
                            <textarea 
                                value={props.aiQuery}
                                onChange={(e) => props.setAiQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); props.handleAiSubmit(); } }}
                                placeholder="Scrivi qui la tua domanda..." 
                                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:border-purple-500 focus:outline-none resize-none shadow-inner h-12 min-h-[3rem] overflow-hidden leading-tight placeholder:text-slate-600 transition-all backdrop-blur-sm"
                            />
                            <button onClick={() => props.handleAiSubmit()} disabled={!props.aiQuery.trim()} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95">
                                <Send className="w-3.5 h-3.5"/>
                            </button>
                        </div>
                    </>
                )}
            </div>
            
            {/* GRADIENT BLOBS - ALWAYS VISIBLE BUT SUBTLE */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2 z-0"></div>
        </div>
    );
};
