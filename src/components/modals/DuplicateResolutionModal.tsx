import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Copy, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { ItineraryItem, PointOfInterest } from '../../types/index';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

interface DuplicateResolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddDuplicate: (dayIndex: number) => void;
    onReplace: (dayIndex: number) => void;
    newItemPoi: PointOfInterest;
    existingItem: ItineraryItem;
    targetDayIndex: number;
    targetTime: string;
    days: Date[];
}

export const DuplicateResolutionModal = ({ isOpen, onClose, onAddDuplicate, onReplace, newItemPoi, existingItem, targetDayIndex, targetTime, days }: DuplicateResolutionModalProps) => {
    const [selectedDay, setSelectedDay] = useState<number>(targetDayIndex);

    const isMobile = useMobileDetect();
    const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
    const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
    const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
    const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
    const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
    const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

    useEffect(() => {
        if (isOpen) setSelectedDay(targetDayIndex);
    }, [isOpen, targetDayIndex]);

    useGlobalModalEscape(isOpen, onClose);

    if (!isOpen) return null;

    return createPortal(
        <div
            className={`td-modal-overlay ${overlayShell} !items-center`}
            onClick={onClose}
            style={{ zIndex: Z_OVERLAY }}
        >
            <div
                className={`${containerShell} max-w-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 border-amber-600/50`}
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="duplicate-resolution-title"
                aria-describedby="duplicate-resolution-desc"
            >
                <CloseButton
                    onClose={onClose}
                    variant="primary"
                    position="absolute"
                    className={`${closeOffsetShell} z-local-overlay`}
                />

                <div className={`${bodyShell} min-h-0`}>
                    <div className="flex items-start gap-4 mb-6 pr-10">
                        <div className="p-3 bg-amber-500/20 rounded-full flex-shrink-0">
                            <AlertCircle className="w-8 h-8 text-amber-500" aria-hidden />
                        </div>
                        <div>
                            <h3 id="duplicate-resolution-title" className={`${modalTitleShell} mb-1`}>Tappa già presente</h3>
                            <p id="duplicate-resolution-desc" className={modalSubtitleShell}>
                                Hai già inserito <strong className="text-white">{newItemPoi.name}</strong> nel tuo diario:
                            </p>
                            <div className="mt-2 bg-slate-800/50 p-2 rounded border border-slate-700 text-xs text-slate-400">
                                Giorno {existingItem.dayIndex + 1} alle {existingItem.timeSlotStr}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest text-center mb-2">Cosa vuoi fare?</p>

                        {days.length > 0 && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5 ml-1">
                                    <Calendar className="w-3.5 h-3.5" /> Giorno di destinazione
                                </label>
                                <select
                                    value={selectedDay}
                                    onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                                >
                                    {days.map((d, idx) => (
                                        <option key={idx} value={idx}>
                                            Giorno {idx + 1} - {d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => onAddDuplicate(selectedDay)}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl border border-slate-700 hover:border-blue-500 transition-all flex items-center justify-center gap-3 group"
                        >
                            <Copy className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                            <div className="text-left">
                                <div className="text-sm">Aggiungi Duplicato</div>
                                <div className="text-[10px] text-slate-400 font-normal">Mantieni entrambi nel diario</div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => onReplace(selectedDay)}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl border border-slate-700 hover:border-emerald-500 transition-all flex items-center justify-center gap-3 group"
                        >
                            <RefreshCw className="w-5 h-5 text-emerald-500 group-hover:rotate-180 transition-transform" />
                            <div className="text-left">
                                <div className="text-sm">Sposta qui (Rimuovi precedente)</div>
                                <div className="text-[10px] text-slate-400 font-normal">Inserisci al Giorno {selectedDay + 1}, {targetTime}</div>
                            </div>
                        </button>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                        <button type="button" onClick={onClose} className="text-slate-500 hover:text-white text-sm font-medium transition-colors">
                            Annulla operazione
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
