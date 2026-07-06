import { Z_OVERLAY, Z_MODAL } from '@/constants/zIndex';

import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Calendar, CheckSquare } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { useGlobalModalEscape } from '@/hooks/useGlobalModalEscape';
import { ItineraryItem } from '../../types/index';
import { useFoundationStyles } from '@/hooks/useFoundationStyles';
import { FOUNDATION_STYLE_KEYS } from '@/data/system/foundationSettingsCatalog';
import { useMobileDetect } from '@/hooks/ui/useMobileDetect';

interface RemoveItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: ItineraryItem[];
    onRemoveSingle: (itemId: string) => void;
    onRemoveAll: () => void;
}

export const RemoveItemModal = ({ isOpen, onClose, items, onRemoveSingle, onRemoveAll }: RemoveItemModalProps) => {
    const isMobile = useMobileDetect();
    const overlayShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalOverlay);
    const containerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalContainer);
    const headerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalHeader);
    const bodyShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalBody);
    const footerShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalFooter);
    const closeOffsetShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalCloseOffset);
    const modalTitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalTitle, isMobile);
    const modalSubtitleShell = useFoundationStyles(FOUNDATION_STYLE_KEYS.modalSubtitle, isMobile);

    useGlobalModalEscape(isOpen, onClose);

    if (!isOpen || items.length === 0) return null;

    const poiName = items[0].poi.name;

    return createPortal(
        <div
            className={`td-modal-overlay ${overlayShell} !items-center`}
            style={{ zIndex: Z_OVERLAY }}
            onClick={onClose}
        >
            <div
                className={`${containerShell} max-w-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 border-red-500/30`}
                style={{ zIndex: Z_MODAL }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="remove-item-title"
                aria-describedby="remove-item-desc"
            >
                <CloseButton
                    onClose={onClose}
                    variant="primary"
                    position="absolute"
                    className={`${closeOffsetShell} z-local-overlay`}
                />

                <header className={headerShell}>
                    <div className="flex items-center gap-3 pr-10 min-w-0">
                        <div className="p-2 bg-red-500/20 rounded-full text-red-500 shrink-0">
                            <Trash2 className="w-6 h-6" aria-hidden />
                        </div>
                        <div className="min-w-0">
                            <h3 id="remove-item-title" className={`${modalTitleShell} leading-none`}>Rimuovi Tappa</h3>
                            <p id="remove-item-desc" className={`${modalSubtitleShell} mt-1 truncate`}>"{poiName}" è presente più volte</p>
                        </div>
                    </div>
                </header>

                <div className={`${bodyShell} min-h-0`}>
                    <p className="text-sm text-slate-300 mb-4">
                        Quale istanza vuoi rimuovere dal tuo diario?
                    </p>

                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                        {items.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onRemoveSingle(item.id)}
                                className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 p-3 rounded-xl border border-slate-700 hover:border-red-500/50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-900 p-2 rounded-lg text-slate-400 group-hover:text-white">
                                        <Calendar className="w-4 h-4" aria-hidden />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-white text-sm">Giorno {item.dayIndex + 1}</div>
                                        <div className="text-xs text-slate-400 font-mono bg-slate-900 px-1.5 rounded inline-block mt-0.5">
                                            ore {item.timeSlotStr}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold uppercase">
                                    Rimuovi
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <footer className={footerShell}>
                    <div className="flex flex-col gap-2 w-full">
                        <button
                            type="button"
                            onClick={onRemoveAll}
                            className="w-full py-3 bg-red-900/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-sm font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckSquare className="w-4 h-4" /> Rimuovi tutte le ({items.length}) copie
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-2 text-slate-500 hover:text-white text-xs font-bold uppercase transition-colors"
                        >
                            Annulla
                        </button>
                    </div>
                </footer>
            </div>
        </div>,
        document.body
    );
};
