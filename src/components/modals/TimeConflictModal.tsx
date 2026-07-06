import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { AlertTriangle, ArrowRightLeft, ArrowRight, Clock } from 'lucide-react';
import { ItineraryItem } from '../../types/index';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

interface TimeConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newTime: string) => void;
    /** Scambia le due tappe usando l'orario di destinazione scelto per ciascuna. */
    onSwap: (itemTime: string, conflictTime: string) => void;
    item: ItineraryItem;
    targetDayIndex: number;
    conflictingItem: ItineraryItem;
    /** Tutte le tappe del diario: usate per evidenziare gli orari occupati nei giorni di destinazione. */
    allItems: ItineraryItem[];
}

// Slot a intervalli di 15 minuti — stessa griglia oraria usata negli altri modali del Diario.
const TIME_SLOTS: string[] = (() => {
    const slots: string[] = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }
    return slots;
})();

/**
 * Selettore orario di destinazione: stessa logica/comportamento degli altri modali del Diario
 * (slot occupati disabilitati e marcati "Occupato").
 */
const DestinationTimeSelect = ({
    value,
    onChange,
    occupied,
}: {
    value: string;
    onChange: (time: string) => void;
    occupied: ItineraryItem[];
}) => {
    const isOccupied = (time: string) => occupied.some((i) => i.timeSlotStr === time);
    return (
        <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white font-mono font-bold focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer"
            >
                {TIME_SLOTS.map((t) => {
                    const occ = isOccupied(t);
                    return (
                        <option key={t} value={t} disabled={occ} className={occ ? 'text-slate-600 bg-slate-900 italic' : 'text-white font-bold'}>
                            {t} {occ ? '(Occupato)' : ''}
                        </option>
                    );
                })}
            </select>
        </div>
    );
};

export const TimeConflictModal = ({ isOpen, onClose, onConfirm, onSwap, item, targetDayIndex, conflictingItem, allItems }: TimeConflictModalProps) => {
    const [selectedTime, setSelectedTime] = useState<string>('09:00');
    // Orari di destinazione per lo scambio (default: ciascuna prende lo slot dell'altra).
    const [itemDestTime, setItemDestTime] = useState<string>(conflictingItem.timeSlotStr);
    const [conflictDestTime, setConflictDestTime] = useState<string>(item.timeSlotStr);

    const isMobile = useMobileDetect();
    const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
    const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
    const headerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeader);
    const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
    const footerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooter);
    const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
    const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
    const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

    useEffect(() => {
        if (isOpen) {
            setItemDestTime(conflictingItem.timeSlotStr);
            setConflictDestTime(item.timeSlotStr);
        }
    }, [isOpen, item, conflictingItem]);

    // ESC Handling
    useGlobalModalEscape(isOpen, onClose);

    const existingItemsInTargetDay = useMemo(
        () => allItems.filter((i) => i.dayIndex === targetDayIndex),
        [allItems, targetDayIndex],
    );
    const itemDestOccupied = useMemo(
        () => allItems.filter(
            (i) => i.dayIndex === targetDayIndex && i.id !== item.id && i.id !== conflictingItem.id,
        ),
        [allItems, targetDayIndex, item.id, conflictingItem.id],
    );
    const conflictDestOccupied = useMemo(
        () => allItems.filter(
            (i) => i.dayIndex === item.dayIndex && i.id !== item.id && i.id !== conflictingItem.id,
        ),
        [allItems, item.dayIndex, item.id, conflictingItem.id],
    );

    if (!isOpen) return null;

    return createPortal(
        <div
            className={`td-modal-overlay ${overlayShell} !items-center`}
            onClick={onClose}
            style={{ zIndex: Z_OVERLAY }}
        >
             <div
                className={`${containerShell} max-w-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 border-amber-500/30`}
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="time-conflict-title"
                aria-describedby="time-conflict-desc"
            >
                <CloseButton
                    onClose={onClose}
                    variant="primary"
                    position="absolute"
                    className={`${closeOffsetShell} z-local-overlay`}
                />

                <header className={headerShell}>
                    <div className="flex items-start gap-4 pr-10 min-w-0">
                         <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 shrink-0">
                            <AlertTriangle className="w-8 h-8 text-amber-500 animate-pulse" aria-hidden />
                         </div>
                         <div className="min-w-0">
                            <h3 id="time-conflict-title" className={`${modalTitleShell} leading-none`}>Conflitto Orario</h3>
                            <p id="time-conflict-desc" className={`${modalSubtitleShell} mt-1`}>Spostamento tappa</p>
                         </div>
                    </div>
                </header>

                <div className={`${bodyShell} min-h-0 overflow-y-auto custom-scrollbar`}>
                    
                    {/* ALERT BANNER */}
                    <div className="flex items-center justify-center mb-6">
                        <span className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-orange-900/50 animate-bounce">
                            Orario Occupato!
                        </span>
                    </div>

                    {/* BOX VISUAL COMPARISON — spostamento esplicito di entrambe le tappe */}
                    <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 shadow-inner space-y-3">

                        {/* 1. TAPPA CHE SI STA SPOSTANDO */}
                        <div className="bg-indigo-900/20 rounded-xl p-4 shadow-xl relative ring-1 ring-indigo-500/20 border-l-4 border-indigo-500">
                            <div className="absolute top-2 right-2 text-[9px] font-black text-indigo-400 uppercase tracking-wider bg-indigo-950/30 px-2 py-0.5 rounded">
                                Si sposta
                            </div>
                            <h4 className="font-bold text-white text-base truncate pr-16">{item.poi.name}</h4>
                            <div className="flex items-center gap-2 mt-1.5 mb-3 text-[11px] font-black uppercase tracking-wider">
                                <span className="text-slate-500">Giorno {item.dayIndex + 1}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="text-indigo-300">Giorno {targetDayIndex + 1}</span>
                            </div>
                            <DestinationTimeSelect value={itemDestTime} onChange={setItemDestTime} occupied={itemDestOccupied} />
                        </div>

                        {/* CONNECTOR */}
                        <div className="flex items-center justify-center relative z-floating-panel">
                            <div className="bg-slate-800 text-slate-300 text-[10px] font-black px-3 py-1 rounded-full border border-slate-700 shadow-sm flex items-center gap-1.5 uppercase tracking-widest">
                                <ArrowRightLeft className="w-3 h-3 text-indigo-400" /> Sostituire con
                            </div>
                        </div>

                        {/* 2. TAPPA CHE VERRÀ SCAMBIATA */}
                        <div className="bg-slate-900 rounded-xl p-4 shadow-lg relative border-l-4 border-amber-500">
                            <div className="absolute top-2 right-2 text-[9px] font-black text-amber-500 uppercase tracking-wider bg-amber-950/30 px-2 py-0.5 rounded">
                                Scambiata
                            </div>
                            <h4 className="font-bold text-slate-200 text-base truncate pr-16">{conflictingItem.poi.name}</h4>
                            <div className="flex items-center gap-2 mt-1.5 mb-3 text-[11px] font-black uppercase tracking-wider">
                                <span className="text-slate-500">Giorno {conflictingItem.dayIndex + 1}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="text-amber-300">Giorno {item.dayIndex + 1}</span>
                            </div>
                            <DestinationTimeSelect value={conflictDestTime} onChange={setConflictDestTime} occupied={conflictDestOccupied} />
                        </div>
                    </div>

                    {/* ACTION 1: SWAP */}
                    <div className="mt-6 mb-8">
                        <button 
                            type="button"
                            onClick={() => onSwap(itemDestTime, conflictDestTime)} 
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-3 group active:scale-95 border border-indigo-400/20"
                        >
                            <ArrowRightLeft className="w-5 h-5"/>
                            Sostituisci
                        </button>
                    </div>

                    {/* DIVIDER */}
                    <div className="relative flex items-center py-2 mb-6">
                         <div className="flex-grow border-t border-slate-700"></div>
                         <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">Oppure cambia orario</span>
                         <div className="flex-grow border-t border-slate-700"></div>
                    </div>

                    {/* ACTION 2: CHANGE TIME */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                            <select 
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white font-mono font-bold focus:border-amber-500 focus:outline-none appearance-none cursor-pointer"
                            >
                                {TIME_SLOTS.map(time => {
                                    const conflict = existingItemsInTargetDay.find(i => i.timeSlotStr === time && i.id !== item.id);
                                    return (
                                        <option key={time} value={time} disabled={!!conflict} className={conflict ? "text-slate-600 bg-slate-900 italic" : "text-white font-bold"}>
                                            {time} {conflict ? `(Occupato)` : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <button type="button" onClick={() => onConfirm(selectedTime)} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 rounded-xl transition-colors border border-slate-700 uppercase text-xs tracking-wider">
                            Conferma
                        </button>
                    </div>

                </div>

                <footer className={`${footerShell} text-center`}>
                     <button
                        type="button"
                        onClick={onClose}
                        className="text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest transition-colors py-2"
                     >
                        Annulla Operazione
                     </button>
                </footer>

             </div>
        </div>,
        document.body
    );
};



