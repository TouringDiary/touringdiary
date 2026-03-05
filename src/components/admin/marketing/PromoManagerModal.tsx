
import React, { useState } from 'react';
import { Tag, Trash2, X, Plus } from 'lucide-react';

interface PromoManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string) => void;
    promoTypes: { id: string, label: string }[];
    onDeleteRequest: (id: string, label: string) => void;
}

export const PromoManagerModal = ({ isOpen, onClose, onAdd, promoTypes, onDeleteRequest }: PromoManagerModalProps) => {
    const [newPromoName, setNewPromoName] = useState('');

    const handleAdd = () => {
        if (!newPromoName.trim()) return;
        onAdd(newPromoName);
        setNewPromoName('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-indigo-500/50 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Tag className="w-5 h-5 text-indigo-500"/> Gestione Promo</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
                </div>

                {/* ADD SECTION */}
                <div className="space-y-2 mb-6 shrink-0">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block ml-1">Nuova Etichetta</label>
                    <div className="flex gap-2">
                        <input 
                            autoFocus
                            value={newPromoName}
                            onChange={e => setNewPromoName(e.target.value)}
                            placeholder="Es. Pasqua 2026"
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-indigo-500 outline-none font-bold text-sm"
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        />
                        <button onClick={handleAdd} disabled={!newPromoName.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2.5 rounded-lg transition-colors">
                            <Plus className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                {/* LIST SECTION */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 border-t border-slate-800 pt-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-3 ml-1">Campagne Attive ({promoTypes.length})</label>
                    {promoTypes.length === 0 ? (
                         <div className="text-center py-6 text-slate-600 text-xs italic">Nessuna etichetta salvata.</div>
                    ) : (
                        <div className="space-y-2">
                            {promoTypes.map(promo => (
                                <div key={promo.id} className="flex items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-800 group hover:border-slate-700 transition-colors">
                                    <span className="text-sm text-slate-200 font-medium">{promo.label}</span>
                                    <button 
                                        onClick={() => onDeleteRequest(promo.id, promo.label)}
                                        className="text-slate-600 hover:text-red-500 p-1.5 hover:bg-slate-900 rounded transition-all"
                                        title="Elimina etichetta"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 shrink-0">
                    <button onClick={onClose} className="w-full py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors text-sm uppercase">Chiudi</button>
                </div>
            </div>
        </div>
    );
};
