import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { Calendar, Clock, ArrowRightLeft, CheckCircle, RefreshCw } from 'lucide-react';
import { ItineraryItem } from '../../types/index';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

interface MobileMoveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (dayIndex: number, time: string, forceSwap?: boolean) => void;
    item: ItineraryItem;
    days: Date[];
    allItems: ItineraryItem[];
}

export const MobileMoveModal = ({ isOpen, onClose, onConfirm, item, days, allItems }: MobileMoveModalProps) => {
    const [selectedDay, setSelectedDay] = useState<number>(item.dayIndex);
    const [selectedTime, setSelectedTime] = useState<string>(item.timeSlotStr);

    const isMobile = useMobileDetect();
    const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
    const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
    const headerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeader);
    const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
    const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
    const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
    const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

    const timeSlots = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            timeSlots.push(timeStr);
        }
    }

    useEffect(() => {
        if (isOpen) {
            setSelectedDay(item.dayIndex);
            setSelectedTime(item.timeSlotStr);
        }
    }, [isOpen, item]);

    useGlobalModalEscape(isOpen, onClose);

    const isTargetOccupied = allItems.some(i =>
        i.dayIndex === selectedDay &&
        i.timeSlotStr === selectedTime &&
        i.id !== item.id
    );

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(selectedDay, selectedTime, isTargetOccupied);
        onClose();
    };

    return createPortal(
        <div
            className={`td-modal-overlay ${overlayShell} !items-center`}
            style={{ zIndex: Z_OVERLAY }}
            onClick={onClose}
        >
            <div
                className={`${containerShell} max-w-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`}
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="mobile-move-title"
                aria-describedby="mobile-move-desc"
            >
                <CloseButton
                    onClose={onClose}
                    variant="primary"
                    position="absolute"
                    className={`${closeOffsetShell} z-local-overlay`}
                />

                <header className={headerShell}>
                    <div className="flex items-center gap-3 pr-10 min-w-0">
                        <div className="p-2 bg-indigo-900/30 rounded-lg border border-indigo-500/30 shrink-0">
                            <ArrowRightLeft className="w-5 h-5 text-indigo-400" aria-hidden />
                        </div>
                        <div className="min-w-0">
                            <h3 id="mobile-move-title" className={`${modalTitleShell} leading-none`}>Sposta Tappa</h3>
                            <p id="mobile-move-desc" className={`${modalSubtitleShell} mt-1 truncate`}>{item.poi.name}</p>
                        </div>
                    </div>
                </header>

                <div className={`${bodyShell} space-y-6 min-h-0`}>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 ml-1">
                            <Calendar className="w-3.5 h-3.5" /> Seleziona Giorno
                        </label>
                        <select
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:border-indigo-500 outline-none text-base appearance-none shadow-inner cursor-pointer"
                        >
                            {days.map((d, idx) => (
                                <option key={idx} value={idx}>
                                    Giorno {idx + 1} - {d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5 ml-1">
                            <Clock className="w-3.5 h-3.5" /> Seleziona Orario
                        </label>
                        <select
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className={`w-full bg-slate-950 border rounded-xl p-4 text-base appearance-none font-mono shadow-inner cursor-pointer outline-none ${isTargetOccupied ? 'border-amber-500 text-amber-500 font-bold' : 'border-slate-700 text-white focus:border-indigo-500'}`}
                        >
                            {timeSlots.map(t => {
                                const isOccupied = allItems.some(i =>
                                    i.dayIndex === selectedDay &&
                                    i.timeSlotStr === t &&
                                    i.id !== item.id
                                );

                                return (
                                    <option
                                        key={t}
                                        value={t}
                                        className={isOccupied ? "text-amber-500 bg-slate-900 font-bold" : "text-white"}
                                    >
                                        {t} {isOccupied ? '(Occupato - Scambia)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                        {isTargetOccupied && (
                            <p className="text-[10px] text-amber-500 font-bold ml-1 animate-pulse">
                                Attenzione: Orario occupato. Conferma per invertire le tappe.
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleConfirm}
                        className={`w-full text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 text-sm uppercase tracking-widest mt-4 ${isTargetOccupied ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'}`}
                    >
                        {isTargetOccupied ? <RefreshCw className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        {isTargetOccupied ? 'Conferma e Inverti' : 'Conferma Spostamento'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
