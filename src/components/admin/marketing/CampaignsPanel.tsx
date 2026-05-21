import { Z_OVERLAY, Z_ADMIN_MODAL } from '@/constants/zIndex';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Trash2, Plus, Zap, Clock, CheckCircle, AlertCircle, Tag, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { getCampaigns, createCampaign } from '@/services/aiAdminService';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';

interface CampaignsPanelProps {
    campaigns: any[];
    onAdd: (name: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export const CampaignsPanel: React.FC<CampaignsPanelProps> = ({ campaigns, onAdd, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allCampaigns, setAllCampaigns] = useState<any[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState('');
    const [customName, setCustomName] = useState('');
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Confirmation Modal
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, name: string }>({ isOpen: false, name: '' });

    useEffect(() => {
        if (isModalOpen) {
            setLoadingCampaigns(true);
            getCampaigns()
                .then(setAllCampaigns)
                .finally(() => setLoadingCampaigns(false));
        }
    }, [isModalOpen]);

    const handlePreAdd = () => {
        let finalName = '';
        if (selectedCampaignId) {
            const selected = allCampaigns.find(c => c.id === selectedCampaignId);
            finalName = selected?.name || '';
        } else {
            finalName = customName;
        }

        if (!finalName) return;
        
        // Apriamo il modale di conferma invece di procedere direttamente
        setConfirmModal({ isOpen: true, name: finalName });
    };

    const handleConfirmCreate = async () => {
        const finalName = confirmModal.name;
        setIsSubmitting(true);
        setConfirmModal({ ...confirmModal, isOpen: false });
        
        try {
            await onAdd(finalName);
            setIsModalOpen(false);
            setCustomName('');
            setSelectedCampaignId('');
        } catch (err) {
            console.error("Create campaign failed:", err);
            // Non chiudiamo il modale principale in caso di errore, permettiamo di riprovare
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-indigo-400" />
                    <h3 className="text-xl font-black text-white uppercase italic tracking-wider">Marketing Campaigns</h3>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-xl shadow-indigo-900/20 active:scale-95"
                >
                    <Plus className="w-4 h-4" /> NUOVA CAMPAGNA
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {campaigns.length === 0 ? (
                    <div className="col-span-2 py-20 text-center bg-slate-900/50 border border-dashed border-slate-700 rounded-3xl">
                        <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nessuna campagna attiva</p>
                    </div>
                ) : (
                    campaigns.map((camp) => {
                        const now = new Date();
                        const isActive = !camp.end_date || new Date(camp.end_date) >= now;

                        return (
                            <div key={camp.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center justify-between group hover:border-slate-700 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className={`p-4 rounded-2xl transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                        <Zap className={isActive ? 'animate-pulse' : ''} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-lg font-black text-white uppercase tracking-tight">{camp.name}</h4>
                                            {isActive ? (
                                                <span className="text-[8px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase">Live</span>
                                            ) : (
                                                <span className="text-[8px] font-black bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded uppercase">Offline</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{camp.start_date ? format(new Date(camp.start_date), 'dd MMM yy', { locale: it }) : 'Immediato'}</span>
                                            </div>
                                            <span>→</span>
                                            <div className="flex items-center gap-1">
                                                <span>{camp.end_date ? format(new Date(camp.end_date), 'dd MMM yy', { locale: it }) : 'Senza scadenza'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => onDelete(camp.id)}
                                    className="p-3 bg-slate-800 hover:bg-red-900/40 text-slate-500 hover:text-red-400 rounded-2xl transition-all border border-slate-700"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {isModalOpen && createPortal(
                // admin-super-layer modal | intentionally rendered above global modal stack (z-13000)
                <div className="td-modal-overlay bg-slate-950/90 backdrop-blur-md animate-in fade-in p-4" style={{ zIndex: Z_OVERLAY }}>
                    <div 
                        className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95"
                        style={{ zIndex: Z_ADMIN_MODAL }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CloseButton 
                            onClose={() => setIsModalOpen(false)} 
                            variant="primary" 
                            position="absolute" 
                            className="top-6 right-6" 
                        />

                        <div className="p-8 border-b border-slate-800 bg-gradient-to-r from-indigo-900/20 to-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Nuova Campagna</h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Seleziona o crea un codice promo</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Seleziona Campagna Esistente</label>
                                <select 
                                    value={selectedCampaignId}
                                    onChange={(e) => { setSelectedCampaignId(e.target.value); setCustomName(''); }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                                    disabled={loadingCampaigns}
                                >
                                    <option value="">-- Scegli dall'elenco --</option>
                                    {allCampaigns.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {loadingCampaigns && <p className="text-[10px] text-indigo-400 animate-pulse uppercase font-black ml-2">Caricamento...</p>}
                            </div>

                            <div className="relative flex items-center gap-4 py-2">
                                <div className="flex-1 h-px bg-slate-800"></div>
                                <span className="text-[10px] font-black text-slate-600 uppercase">oppure</span>
                                <div className="flex-1 h-px bg-slate-800"></div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nuova Campagna (Nome/Codice)</label>
                                <div className="relative">
                                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                                    <input 
                                        type="text" 
                                        value={customName}
                                        onChange={(e) => { setCustomName(e.target.value.toUpperCase()); setSelectedCampaignId(''); }}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 text-white font-black outline-none focus:border-indigo-500 transition-colors uppercase placeholder:normal-case"
                                        placeholder="es. BLACK_FRIDAY_2026"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-800/30 border-t border-slate-800 flex gap-4">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl transition-all text-xs uppercase tracking-widest"
                            >
                                Annulla
                            </button>
                            <button 
                                onClick={handlePreAdd}
                                disabled={isSubmitting || (!selectedCampaignId && !customName)}
                                className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Aggiungi Campagna
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* MODALE DI CONFERMA CREAZIONE */}
            <DeleteConfirmationModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmCreate}
                variant="info"
                title="Conferma Campagna"
                message={`Vuoi creare la campagna ${confirmModal.name} ?`}
                confirmLabel="Conferma"
                cancelLabel="Annulla"
                icon={<Tag className="w-8 h-8" />}
            />
        </div>
    );
};



