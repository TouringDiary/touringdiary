
import React, { useEffect, useState } from 'react';
import { X, ScrollText, BookOpen, PenTool, Calendar, Info } from 'lucide-react';
import { CityDetails } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    city: CityDetails;
    openSuggestion?: () => void;
    customText?: string;
}

export const HistoryModal = ({ isOpen, onClose, city, openSuggestion, customText }: Props) => {
    const [activeTab, setActiveTab] = useState<'history' | 'patron'>('history');

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if(isOpen) setActiveTab('history');
    }, [isOpen]);

    if (!isOpen) return null;

    const rawText = customText || (city.details.historyFull || city.details.historySnippet || '').trim();
    const patron = city.details.patronDetails;

    // PARSER AVANZATO STANDARDIZZATO (STORIA & PATRONO)
    // Rileva: # Titolo, TITOLO: Titolo, o righe TUTO MAIUSCOLO
    const processFormattedContent = (text: string) => {
        if (!text) return '';

        // Pulizia base
        let processedText = text
            .replace(/<br\s*\/?>/gi, '\n') 
            .replace(/<\/?[^>]+(>|$)/g, "") // Strip HTML
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');

        const lines = processedText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        let htmlOutput = '';

        lines.forEach((line) => {
            // 1. Rilevamento TITOLI
            const isMarkdownHeader = line.startsWith('#');
            const isExplicitTitle = line.toUpperCase().startsWith('TITOLO:');
            // Titolo implicito: corto, tutto maiuscolo, no punto finale
            const isImplicitTitle = line.length > 3 && line.length < 80 && line === line.toUpperCase() && !line.endsWith('.');
            
            if (isMarkdownHeader || isExplicitTitle || isImplicitTitle) {
                // Pulizia del titolo da caratteri di controllo
                let titleContent = line
                    .replace(/^#+\s*/, '') // Rimuove #
                    .replace(/^TITOLO:\s*/i, '') // Rimuove TITOLO:
                    .replace(/\*\*/g, '') // Rimuove bold markdown
                    .trim();

                // STILE PERSONAGGI FAMOSI: Arancione, Font Display, Uppercase, Bold, Border Bottom
                htmlOutput += `<h3 class="text-amber-500 font-display font-bold text-xl md:text-2xl mt-6 mb-3 leading-tight tracking-wide uppercase border-b border-amber-500/20 pb-2">${titleContent}</h3>`;
            } else {
                // PARAGRAFO NORMALE
                // Gestione grassetto markdown **testo** all'interno del paragrafo
                const content = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
                htmlOutput += `<p class="text-slate-300 font-serif text-lg leading-relaxed text-justify mb-4">${content}</p>`;
            }
        });

        return htmlOutput;
    };

    const renderPatronContent = () => {
        if (!patron) return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 italic">
                Dati sul Patrono non ancora disponibili.
            </div>
        );
        
        return (
            <div className="max-w-3xl mx-auto relative z-10 animate-in fade-in slide-in-from-right-4">
                <div className="aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative group mb-10">
                    <ImageWithFallback src={patron.imageUrl} alt={patron.name} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-6 left-6 text-white">
                        <div className="flex items-center gap-3 mb-1">
                            <Calendar className="w-5 h-5 text-amber-500"/>
                            <span className="text-sm font-bold uppercase tracking-widest text-amber-400">Ricorrenza</span>
                        </div>
                        <div className="text-3xl font-display font-bold">{patron.date}</div>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 leading-none">{patron.name}</h1>
                    <div className="h-1 w-24 bg-amber-500 mx-auto rounded-full"></div>
                </div>

                {/* Usa lo stesso parser standardizzato anche per la storia del patrono */}
                <div dangerouslySetInnerHTML={{ __html: processFormattedContent(patron.history) }} />
            </div>
        );
    };

    return (
        <div className="fixed top-0 bottom-0 left-0 right-0 z-[2000] flex items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-[#020617] w-full max-w-4xl h-full md:max-h-[90vh] md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5">
                
                <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-6 py-4 border-b border-slate-800 bg-[#0f172a] z-20 shrink-0 gap-4 md:gap-0">
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-orange-500 shadow-lg">
                                {activeTab === 'history' ? <ScrollText className="w-5 h-5"/> : <Info className="w-5 h-5"/>}
                            </div>
                            <div>
                                <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wider font-display leading-none">
                                    {activeTab === 'history' ? 'Storia e Origini' : 'Santo Patrono'}
                                </h2>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{city.name}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="md:hidden p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                            <X className="w-5 h-5"/>
                        </button>
                    </div>

                    <div className="flex md:hidden bg-slate-900 p-1 rounded-xl border border-slate-800 w-full md:w-auto">
                         <button 
                            onClick={() => setActiveTab('history')} 
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                        >
                            Storia
                        </button>
                        <button 
                            onClick={() => setActiveTab('patron')} 
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'patron' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                        >
                            Patrono
                        </button>
                    </div>

                    <button onClick={onClose} className="hidden md:block p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg">
                        <X className="w-6 h-6"/>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar bg-[#020617] relative">
                    <div className="absolute top-20 right-10 opacity-[0.02] pointer-events-none select-none">
                        <BookOpen className="w-96 h-96 text-orange-500"/>
                    </div>
                    
                    {activeTab === 'history' ? (
                        <div className="max-w-3xl mx-auto relative z-10 animate-in fade-in slide-in-from-left-4">
                            <div className="text-center mb-8 pt-4">
                                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 leading-none">{city.name}</h1>
                                <div className="h-1 w-24 bg-amber-500 mx-auto rounded-full"></div>
                            </div>
                            
                            {/* Rendering Storia Formattata */}
                            <div dangerouslySetInnerHTML={{ __html: processFormattedContent(rawText) }} />
                            
                            {openSuggestion && (
                                <div className="mt-16 pt-8 border-t border-slate-800/50 flex justify-end">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openSuggestion(); }}
                                        className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-orange-400 transition-colors uppercase font-black tracking-widest bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 hover:border-orange-500/50"
                                    >
                                        <PenTool className="w-3.5 h-3.5"/> Suggerisci integrazione
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        renderPatronContent()
                    )}
                </div>
            </div>
        </div>
    );
};
