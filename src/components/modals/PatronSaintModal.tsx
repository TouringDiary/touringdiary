import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';

import React from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { Calendar, BookOpen, Info } from 'lucide-react';
import { CityDetails } from '../../types/index';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    city: CityDetails;
}

export const PatronSaintModal = ({ isOpen, onClose, city }: Props) => {
    const patron = city.details.patronDetails;
    
    useGlobalModalEscape(isOpen, onClose);



    if (!isOpen) return null;

    // Helper per pulire tag HTML indesiderati (es. <b>) da stringhe semplici
    const stripHtml = (html: string) => {
        if (!html) return '';
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    const processPatronContent = (text: string) => {
        if (!text) return '';

        const lines = text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        let htmlOutput = '';

        lines.forEach((line) => {
            // RILEVAMENTO TITOLI (Logica unificata con HistoryModal)
            const isMarkdownHeader = line.startsWith('#');
            const isExplicitTitle = line.toUpperCase().startsWith('TITOLO:');
            const isImplicitTitle = line.length > 3 && line.length < 80 && line === line.toUpperCase() && !line.endsWith('.');

            if (isMarkdownHeader || isExplicitTitle || isImplicitTitle) {
                // Pulizia contenuto
                let content = line
                    .replace(/^#+\s*/, '')
                    .replace(/^TITOLO:\s*/i, '')
                    .replace(/\*\*/g, '')
                    .trim();

                // STILE UNIFICATO: Arancione, Uppercase, Font Display, Bold, Border Bottom
                htmlOutput += `<h3 class="text-amber-500 font-display font-bold text-xl md:text-2xl mt-6 mb-3 leading-tight tracking-wide uppercase border-b border-amber-500/20 pb-2">${content}</h3>`;
            } else {
                // PARAGRAFO NORMALE
                let content = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
                htmlOutput += `<p class="text-slate-300 font-serif text-lg leading-relaxed text-justify mb-4">${content}</p>`;
            }
        });

        return htmlOutput;
    };

    return createPortal(
        <div className="td-modal-overlay bg-black/95 backdrop-blur-md flex items-center justify-center p-0 md:p-4 animate-in fade-in pointer-events-auto" style={{ zIndex: Z_OVERLAY }} onClick={onClose}>
            <div 
                className="relative bg-[#020617] w-full max-w-4xl h-full md:max-h-[90vh] md:rounded-3xl border-0 md:border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 pointer-events-auto"
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
            >

                <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800 bg-[#0f172a] shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-amber-500 shadow-lg">
                            <Info className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider font-display">Santo Patrono</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{city.name}</p>
                        </div>
                    </div>
                    <CloseButton onClose={onClose} variant="primary" />
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar bg-[#020617] relative">
                    <div className="absolute top-20 right-10 opacity-[0.02] pointer-events-none select-none">
                        <BookOpen className="w-96 h-96 text-orange-500" />
                    </div>

                    {patron ? (
                        <div className="max-w-3xl mx-auto relative z-floating-panel">
                            <div className="aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative group mb-10">
                                <ImageWithFallback src={patron.imageUrl} alt={patron.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                <div className="absolute bottom-6 left-6 text-white">
                                    <div className="flex items-center gap-3 mb-1">
                                        <Calendar className="w-5 h-5 text-amber-500" />
                                        <span className="text-sm font-bold uppercase tracking-widest text-amber-400">Ricorrenza</span>
                                    </div>
                                    <div className="text-3xl font-display font-bold">{stripHtml(patron.date)}</div>
                                </div>
                            </div>

                            <div className="text-center mb-8">
                                <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 leading-none">{stripHtml(patron.name)}</h1>
                                <div className="h-1 w-24 bg-amber-500 mx-auto rounded-full"></div>
                            </div>

                            <div dangerouslySetInnerHTML={{ __html: processPatronContent(patron.history) }} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 italic">
                            Dati non ancora disponibili per questa città.
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};



