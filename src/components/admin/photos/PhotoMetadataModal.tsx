import { Z_ADMIN_MODAL, Z_ADMIN_MODAL_NESTED } from '@/constants/zIndex';
import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Edit3, MapPin, X } from 'lucide-react';
import type { CitySummary } from '@/types/index';

export type PhotoMetadataModalState = {
    isOpen: boolean;
    photoId: string;
    description: string;
    locationName: string;
    /** When true, save also promotes the photo to Official with resolved cityId. */
    promoteOnSave?: boolean;
};

interface Props {
    modal: PhotoMetadataModalState;
    cityOptions: CitySummary[];
    onChange: (next: PhotoMetadataModalState) => void;
    onClose: () => void;
    onSave: () => void;
    /** Overlay z-index — Admin stack by default; Live Feed can pass Z_MODAL. */
    overlayZIndex?: number;
    contentZIndex?: number;
}

/**
 * Shared metadata editor used by Foto & Moderazione (Admin).
 * Live Feed / Gallery Official promotion uses CommunityPhotoPublishModal (promote mode).
 */
export const PhotoMetadataModal: React.FC<Props> = ({
    modal,
    cityOptions,
    onChange,
    onClose,
    onSave,
    overlayZIndex = Z_ADMIN_MODAL,
    contentZIndex = Z_ADMIN_MODAL_NESTED,
}) => {
    if (!modal.isOpen) return null;

    return createPortal(
        <div
            className="td-modal-overlay p-4 bg-black/80 backdrop-blur-sm flex items-center justify-center fixed inset-0"
            style={{ zIndex: overlayZIndex }}
        >
            <div
                className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl animate-in zoom-in-95"
                style={{ zIndex: contentZIndex }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-indigo-500" /> Modifica Dati Foto
                    </h3>
                    <button type="button" onClick={onClose}>
                        <X className="w-5 h-5 text-slate-500 hover:text-white" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            Città (Location Name)
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                            <select
                                value={modal.locationName}
                                onChange={(e) =>
                                    onChange({ ...modal, locationName: e.target.value })
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none"
                            >
                                <option value="">Seleziona Città...</option>
                                {cityOptions.map((c) => (
                                    <option key={c.id} value={c.name}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            Descrizione
                        </label>
                        <textarea
                            value={modal.description}
                            onChange={(e) =>
                                onChange({ ...modal, description: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-indigo-500 outline-none h-24 resize-none"
                            placeholder="Descrivi la foto..."
                        />
                    </div>

                    {modal.promoteOnSave && (
                        <p className="text-[10px] text-slate-500 leading-relaxed border-l-2 border-amber-500/40 pl-3">
                            La promozione a Official rende la foto visibile nella Galleria Official
                            della città selezionata.
                        </p>
                    )}
                </div>

                <div className="flex gap-2 justify-end mt-6">
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={!modal.locationName.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-xs font-bold uppercase shadow-lg transition-colors flex items-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Salva Modifiche
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
