
import React, { useState, useEffect } from 'react';
import { Phone, Eye, Trash2, Pin, Globe, Mail } from 'lucide-react';
import { ItineraryItem } from '../../../types/index';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { useDynamicStyles } from '../../../hooks/useDynamicStyles';

interface DiaryResourceCardProps {
    item: ItineraryItem;
    onViewDetail: (poi: any) => void;
    onCreateMemo: (item: ItineraryItem) => void;
    onRemove: (id: string) => void;
}

export const DiaryResourceCard: React.FC<DiaryResourceCardProps> = ({ 
    item, 
    onViewDetail, 
    onCreateMemo, 
    onRemove 
}) => {
    const { poi } = item;
    
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const poiNameStyle = useDynamicStyles('diary_poi_name', isMobile);

    const typeLabel = poi.resourceType === 'guide' ? 'Guida Turistica' : 
                      poi.resourceType === 'operator' ? 'Tour Operator' : 'Servizio';

    const hasWeb = !!poi.contactInfo?.website;

    // COSTANTI ALTEZZA
    // h-14 = 3.5rem = 2 righe da 1.75rem (perfettamente in griglia)
    const CARD_HEIGHT = "h-[3.5rem]"; 
    const ROW_HEIGHT = "h-[1.75rem]";

    return (
        <div 
            id={`resource-${item.id}`} 
            className={`group/item relative flex w-full ${CARD_HEIGHT} border-b border-stone-200/50 last:border-0 box-border`}
        >
            {/* COLONNA SINISTRA: FOTO - Centrata verticalmente su 2 righe */}
            <div className="w-14 shrink-0 relative flex items-center justify-center">
                 <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-300 shadow-sm bg-stone-200">
                    <ImageWithFallback 
                        src={poi.imageUrl} 
                        alt={poi.name} 
                        className="w-full h-full object-cover"
                        category="guide"
                    />
                 </div>
            </div>

            {/* COLONNA DESTRA: LAYOUT A DUE RIGHE H-7 FISSE */}
            <div className="flex-1 flex flex-col min-w-0 pr-1">
                
                {/* RIGA 1: NOME + TASTI AZIONE (1.75rem) */}
                <div className={`flex justify-between items-center ${ROW_HEIGHT} w-full`}>
                    <div className="flex-1 min-w-0 pr-2 flex items-center h-full">
                        <h4 
                            onClick={() => onViewDetail(poi)}
                            className={`${poiNameStyle} cursor-pointer hover:text-amber-700 transition-colors truncate leading-none pt-1`}
                        >
                            {poi.name}
                        </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 h-full">
                         {hasWeb && (
                            <a 
                                href={poi.contactInfo?.website} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-1 hover:bg-stone-200 rounded text-stone-500 hover:text-indigo-600 transition-colors"
                                title="Sito Web"
                            >
                                <Globe className="w-3.5 h-3.5"/>
                            </a>
                         )}
                         <button 
                            onClick={() => onViewDetail(poi)}
                            className="p-1 hover:bg-stone-200 rounded text-stone-500 hover:text-stone-800 transition-colors"
                            title="Dettagli"
                        >
                            <Eye className="w-3.5 h-3.5"/>
                        </button>
                        <button 
                            onClick={() => onCreateMemo(item)}
                            className="p-1 hover:bg-stone-200 rounded text-stone-500 hover:text-amber-600 transition-colors"
                            title="Aggiungi Memo"
                        >
                            <Pin className="w-3.5 h-3.5"/>
                        </button>
                        <button 
                            onClick={() => onRemove(item.id)}
                            className="p-1 hover:bg-red-100 rounded text-stone-400 hover:text-red-500 transition-colors"
                            title="Rimuovi"
                        >
                            <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                    </div>
                </div>

                {/* RIGA 2: TIPO + TELEFONO (1.75rem) */}
                <div className={`flex justify-between items-center ${ROW_HEIGHT} w-full border-t border-stone-100/50`}>
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wide truncate pr-2 flex items-center h-full pt-0.5">
                        {typeLabel}
                    </span>
                    
                    {poi.contactInfo?.phone && (
                        <div className="flex items-center h-full">
                            <a href={`tel:${poi.contactInfo.phone}`} className="flex items-center gap-1 text-[10px] font-bold text-stone-600 hover:text-emerald-600 transition-colors bg-white/50 px-1.5 py-0.5 rounded border border-stone-200">
                                <Phone className="w-3 h-3"/> {poi.contactInfo.phone}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
