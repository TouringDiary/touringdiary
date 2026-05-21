import type { User } from '@/types/users';
import { Z_OVERLAY, Z_ADMIN_MODAL, Z_MODAL_NESTED, Z_MODAL } from '@/constants/zIndex';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Layers, History, Plus, CheckCircle2, AlertTriangle, ArrowRight, Save, X, Loader2, Sparkles, Zap, ShieldCheck, RefreshCw, Clock } from 'lucide-react';
import { getPricingVersions, createPricingDraft, activatePricingVersion, updatePricingVersion } from '@/services/aiAdminService';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { CloseButton } from '@/components/ui/controls/CloseButton';

export const PricingManager = () => {
    const [versions, setVersions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creatingDraft, setCreatingDraft] = useState<string | null>(null);
    
    // Modal states
    const [showConfirmModal, setShowConfirmModal] = useState<{ isOpen: boolean; versionId: string; type: 'activate' | 'rollback' }>({ isOpen: false, versionId: '', type: 'activate' });
    const [editingDraft, setEditingDraft] = useState<any | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadVersions = async () => {
        setLoading(true);
        try {
            const data = await getPricingVersions();
            setVersions(data);
        } catch (err) {
            console.error("Failed to load pricing versions", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVersions();
    }, []);

    const formatPlanName = (name: string) => {
        if (name === 'PRO_USER') return 'Pro User';
        if (name === 'LOCAL_ACTIVITY') return 'Silver';
        if (name === 'REGIONAL_ACTIVITY') return 'Gold';
        return name || 'Piano Standard';
    };

    const handleCreateDraft = async (baseId: string) => {
        setCreatingDraft(baseId);
        try {
            await createPricingDraft(baseId);
            loadVersions();
        } catch (err) {
            console.error("Failed to create draft", err);
        } finally {
            setCreatingDraft(null);
        }
    };

    const handleConfirmActivation = async () => {
        const { versionId } = showConfirmModal;
        setIsSaving(true);
        try {
            await activatePricingVersion(versionId);
            setShowConfirmModal({ isOpen: false, versionId: '', type: 'activate' });
            loadVersions();
        } catch (err) {
            console.error("Activation failed", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!editingDraft) return;
        setIsSaving(true);
        try {
            await updatePricingVersion(editingDraft.id, {
                price: editingDraft.price,
                duration_days: editingDraft.duration_days,
                ai_limits: editingDraft.ai_limits
            });
            setEditingDraft(null);
            loadVersions();
        } catch (err) {
            console.error("Save failed", err);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Analisi Versioning Listini...</div>;

    const activeVersions = versions.filter(v => v.is_active);
    const draftVersions = versions.filter(v => !v.is_active);

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section - STICKY */}
            <div 
                className="sticky top-0 -mx-4 md:-mx-8 px-4 md:px-8 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 animate-in slide-in-from-top-4"
                style={{ zIndex: Z_MODAL_NESTED }}
            >
                <div className="flex justify-between items-center bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-xl max-w-[1920px] mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                            <Layers size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Pricing Engine Control (SSOT)</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Architettura Immutabile & Governance Economica</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black flex items-center gap-2">
                            <CheckCircle2 size={10} /> SISTEMA CONSISTENTE
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Active Versions Column */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                         <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                             <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Versioni Attive (Produzione)
                         </h3>
                         <span className="text-[10px] font-bold text-slate-500">{activeVersions.length} Piani Attivi</span>
                    </div>

                    <div className="space-y-4">
                        {activeVersions.map(v => (
                            <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[100px] pointer-events-none" />
                                
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700">
                                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-lg font-black text-white uppercase">{formatPlanName(v.plans?.name)}</h4>
                                                <span className="px-2 py-0.5 bg-slate-800 text-slate-500 rounded text-[8px] font-black uppercase">v{v.id.slice(0,4)}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Durata: {v.duration_days} Giorni • Prezzo: €{v.price.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleCreateDraft(v.id)}
                                        disabled={creatingDraft === v.id}
                                        className="px-4 py-2 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2"
                                    >
                                        {creatingDraft === v.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                        Crea Draft
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800">
                                        <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Flash Credits</span>
                                        <div className="flex items-center gap-1.5">
                                            <Zap className="w-3 h-3 text-amber-500" />
                                            <span className="text-sm font-black text-white">{v.ai_limits?.models?.flash || 0}</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800">
                                        <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Pro Credits</span>
                                        <div className="flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3 text-indigo-500" />
                                            <span className="text-sm font-black text-white">{v.ai_limits?.models?.pro || 0}</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800">
                                        <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Daily Soft</span>
                                        <span className="text-sm font-black text-white">{v.ai_limits?.soft_daily_limit || 0}</span>
                                    </div>
                                    <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800">
                                        <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Burst</span>
                                        <span className={`text-[10px] font-black ${v.ai_limits?.burst_allowed ? 'text-emerald-400' : 'text-slate-600'}`}>
                                            {v.ai_limits?.burst_allowed ? 'ABILITATO' : 'DISABILITATO'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Drafts & History Column */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                         <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                             <History className="w-4 h-4 text-amber-500" /> Drafts & Archivio
                         </h3>
                    </div>

                    <div className="space-y-4">
                        {draftVersions.length === 0 && (
                            <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Nessuna bozza presente</p>
                            </div>
                        )}
                        {draftVersions.map(v => (
                            <div key={v.id} className="bg-slate-900 border border-amber-500/20 rounded-3xl p-5 shadow-lg group hover:border-amber-500/40 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase">{formatPlanName(v.plans?.name)}</h4>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Creato il {new Date(v.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${v.valid_until ? 'bg-slate-800 text-slate-600' : 'bg-amber-500/10 text-amber-500'}`}>
                                        {v.valid_until ? 'Archiviato' : 'Draft'}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setEditingDraft(v)}
                                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[9px] font-black uppercase transition-all"
                                    >
                                        Dettagli
                                    </button>
                                    {!v.valid_until && (
                                        <button 
                                            onClick={() => setShowConfirmModal({ isOpen: true, versionId: v.id, type: 'activate' })}
                                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase transition-all"
                                        >
                                            Attiva
                                        </button>
                                    )}
                                    {v.valid_until && (
                                        <button 
                                            onClick={() => setShowConfirmModal({ isOpen: true, versionId: v.id, type: 'rollback' })}
                                            className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <RefreshCw size={10} /> Rollback
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-3xl p-6">
                         <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <AlertTriangle size={12} /> Politica Versioning
                         </h4>
                         <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                             Ogni modifica ai limiti o ai prezzi richiede la creazione di una nuova versione. 
                             Le versioni attive non possono essere modificate (Immutabilità) per garantire la consistenza dello storico transazioni.
                         </p>
                    </div>
                </div>
            </div>

            {/* MODALE EDITING DRAFT */}
            {editingDraft && createPortal(
                // admin-super-layer modal | intentionally rendered above global modal stack (z-13000)
                <div className="td-modal-overlay bg-slate-950/90 backdrop-blur-md animate-in fade-in p-4" style={{ zIndex: Z_OVERLAY }}>
                    <div 
                        className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95"
                        style={{ zIndex: Z_ADMIN_MODAL }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CloseButton onClose={() => setEditingDraft(null)} variant="primary" position="absolute" className="top-6 right-6" />
                        
                        <div className="p-8 border-b border-slate-800 bg-gradient-to-r from-indigo-900/20 to-slate-900">
                             <h2 className="text-2xl font-black text-white tracking-tight uppercase">Configura Bozza Pricing</h2>
                             <p className="text-xs text-slate-500 font-bold uppercase mt-1">{formatPlanName(editingDraft.plans?.name)} • v{editingDraft.id.slice(0,4)}</p>
                        </div>

                        <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Prezzo (€)</label>
                                    <input 
                                        type="number" step="0.01" value={editingDraft.price} 
                                        onChange={(e) => setEditingDraft({...editingDraft, price: parseFloat(e.target.value)})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Durata (Giorni)</label>
                                    <input 
                                        type="number" value={editingDraft.duration_days} 
                                        onChange={(e) => setEditingDraft({...editingDraft, duration_days: parseInt(e.target.value)})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Sparkles size={12} /> Limiti AI</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Flash Credits</label>
                                        <div className="relative">
                                            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                                            <input 
                                                type="number" value={editingDraft.ai_limits?.models?.flash || 0} 
                                                onChange={(e) => setEditingDraft({
                                                    ...editingDraft, 
                                                    ai_limits: { ...editingDraft.ai_limits, models: { ...editingDraft.ai_limits.models, flash: parseInt(e.target.value) } }
                                                })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pro Credits</label>
                                        <div className="relative">
                                            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                                            <input 
                                                type="number" value={editingDraft.ai_limits?.models?.pro || 0} 
                                                onChange={(e) => setEditingDraft({
                                                    ...editingDraft, 
                                                    ai_limits: { ...editingDraft.ai_limits, models: { ...editingDraft.ai_limits.models, pro: parseInt(e.target.value) } }
                                                })}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Soft Daily Limit</label>
                                        <input 
                                            type="number" value={editingDraft.ai_limits?.soft_daily_limit || 0} 
                                            onChange={(e) => setEditingDraft({
                                                ...editingDraft, 
                                                ai_limits: { ...editingDraft.ai_limits, soft_daily_limit: parseInt(e.target.value) }
                                            })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2 flex flex-col justify-end">
                                        <label className="flex items-center gap-3 cursor-pointer group mb-2">
                                            <div className={`w-12 h-6 rounded-full relative transition-all ${editingDraft.ai_limits?.burst_allowed ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'bg-slate-800'}`}>
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingDraft.ai_limits?.burst_allowed ? 'left-7' : 'left-1'}`} />
                                            </div>
                                            <input 
                                                type="checkbox" className="hidden" 
                                                checked={editingDraft.ai_limits?.burst_allowed} 
                                                onChange={(e) => setEditingDraft({
                                                    ...editingDraft, 
                                                    ai_limits: { ...editingDraft.ai_limits, burst_allowed: e.target.checked }
                                                })} 
                                            />
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">Burst Abilitato</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-800/30 border-t border-slate-800 flex gap-4">
                            <button 
                                onClick={() => setEditingDraft(null)}
                                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl transition-all text-xs uppercase tracking-widest"
                            >
                                Annulla
                            </button>
                            <button 
                                onClick={handleSaveDraft}
                                disabled={isSaving}
                                className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Salva Modifiche Bozza
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* MODALE DI CONFERMA ATTIVAZIONE / ROLLBACK */}
            <DeleteConfirmationModal 
                isOpen={showConfirmModal.isOpen}
                onClose={() => setShowConfirmModal({ isOpen: false, versionId: '', type: 'activate' })}
                onConfirm={handleConfirmActivation}
                variant={showConfirmModal.type === 'rollback' ? 'info' : 'success'}
                title={showConfirmModal.type === 'rollback' ? 'Conferma Rollback' : 'Attivazione Listino'}
                message={showConfirmModal.type === 'rollback' 
                    ? "Sei sicuro di voler ripristinare questa versione precedente?\nLa versione attualmente live verrà archiviata." 
                    : "L'attivazione di questa bozza renderà il listino immediatamente disponibile agli utenti e archivierà la versione corrente.\nProcedere?"}
                confirmLabel={showConfirmModal.type === 'rollback' ? "Esegui Rollback" : "Attiva Ora"}
                isDeleting={isSaving}
                icon={showConfirmModal.type === 'rollback' ? <RefreshCw className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
            />
        </div>
    );
};



