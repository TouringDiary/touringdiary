import { Z_OVERLAY, Z_ADMIN_MODAL } from '@/constants/zIndex';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, Save, X, GripVertical, CheckCircle2, AlertCircle, Euro, Zap, Sparkles, Loader2 } from 'lucide-react';
import { CloseButton } from '@/components/ui/controls/CloseButton';
import { getCreditPackages, upsertCreditPackage, CreditPackage } from '@/services/aiAdminService';

export const AdminCreditPackages = () => {
    const [packages, setPackages] = useState<CreditPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<CreditPackage | null>(null);
    const [saving, setSaving] = useState(false);

    const loadPackages = async () => {
        setLoading(true);
        try {
            const data = await getCreditPackages();
            setPackages(data);
        } catch (err) {
            console.error("Failed to load packages", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPackages();
    }, []);

    const handleSave = async () => {
        if (!editing) return;
        setSaving(true);
        try {
            await upsertCreditPackage(editing);
            setEditing(null);
            loadPackages();
        } catch (err) {
            console.error("Failed to save package", err);
            alert("Errore durante il salvataggio");
        } finally {
            setSaving(false);
        }
    };

    const startNew = () => {
        setEditing({
            name: '',
            description: '',
            flash_credits: 0,
            pro_credits: 0,
            price_eur: 0,
            stripe_price_id_test: '',
            stripe_price_id_prod: '',
            is_active: true,
            sort_order: packages.length + 1,
            is_recommended: false
        });
    };

    if (loading) return <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Caricamento Pacchetti...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Gestione Pacchetti Crediti</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase mt-1">Configura le offerte extra per gli utenti</p>
                </div>
                <button
                    onClick={startNew}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Nuovo Pacchetto
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {packages.map((pkg) => (
                    <div
                        key={pkg.id}
                        className={`bg-slate-900 border ${pkg.is_active ? 'border-slate-800' : 'border-rose-500/30'} rounded-3xl p-6 shadow-xl relative group transition-all hover:border-indigo-500/50`}
                    >
                        {pkg.is_recommended && (
                            <div className="absolute -top-3 left-6 px-3 py-1 bg-amber-500 rounded-full text-[8px] font-black text-slate-950 uppercase tracking-widest shadow-lg shadow-amber-500/20 z-floating-panel flex items-center gap-1">
                                <Sparkles size={8} /> Consigliato
                            </div>
                        )}
                        {!pkg.is_active && (
                            <div className="absolute top-4 right-4 px-2 py-1 bg-rose-500/10 border border-rose-500/30 rounded text-[8px] font-black text-rose-500 uppercase">Non Attivo</div>
                        )}

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                                <p className="text-xs text-slate-500 mt-1">{pkg.description}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditing(pkg)}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Prezzo</span>
                                <div className="flex items-center gap-1.5 text-white">
                                    <Euro className="w-3 h-3 text-emerald-400" />
                                    <span className="text-xl font-black">{pkg.price_eur.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Flash</span>
                                <div className="flex items-center gap-1.5 text-white">
                                    <Zap className="w-3 h-3 text-amber-400" />
                                    <span className="text-xl font-black">{pkg.flash_credits}</span>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-950/50 rounded-2xl border border-slate-800">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Pro</span>
                                <div className="flex items-center gap-1.5 text-white">
                                    <Sparkles className="w-3 h-3 text-indigo-400" />
                                    <span className="text-xl font-black">{pkg.pro_credits}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-slate-950/30 rounded-lg border border-slate-800/50">
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Stripe Test</span>
                                <span className="text-[9px] font-mono text-indigo-400 truncate ml-4">{pkg.stripe_price_id_test || 'NON CONFIGURATO'}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-slate-950/30 rounded-lg border border-slate-800/50">
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Stripe Prod</span>
                                <span className="text-[9px] font-mono text-rose-400 truncate ml-4">{pkg.stripe_price_id_prod || 'NON CONFIGURATO'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {editing && createPortal(
                // admin-super-layer modal | intentionally rendered above global modal stack (z-13000)
                <div className="td-modal-overlay bg-slate-950/90 backdrop-blur-md animate-in fade-in p-4" style={{ zIndex: Z_OVERLAY }}>
                    <div
                        className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95"
                        style={{ zIndex: Z_ADMIN_MODAL }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CloseButton
                            onClose={() => setEditing(null)}
                            variant="primary"
                            position="absolute"
                            className="top-6 right-6"
                        />

                        <div className="p-8 border-b border-slate-800 bg-gradient-to-r from-indigo-900/20 to-slate-900">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Modifica Pacchetto</h2>
                                <p className="text-xs text-slate-500 font-bold uppercase mt-1">Configurazione parametri Stripe e crediti</p>
                            </div>
                        </div>

                        <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Pacchetto</label>
                                    <input
                                        type="text" value={editing.name}
                                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="es. Entry Pack"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Prezzo (€)</label>
                                    <input
                                        type="number" step="0.01" value={editing.price_eur}
                                        onChange={(e) => setEditing({ ...editing, price_eur: parseFloat(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrizione Breve</label>
                                <textarea
                                    value={editing.description}
                                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-300 text-sm outline-none focus:border-indigo-500 transition-colors h-24 resize-none"
                                    placeholder="Descrivi cosa include il pacchetto..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Crediti Flash</label>
                                    <div className="relative">
                                        <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                                        <input
                                            type="number" value={editing.flash_credits}
                                            onChange={(e) => setEditing({ ...editing, flash_credits: parseInt(e.target.value) })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Crediti Pro</label>
                                    <div className="relative">
                                        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                                        <input
                                            type="number" value={editing.pro_credits}
                                            onChange={(e) => setEditing({ ...editing, pro_credits: parseInt(e.target.value) })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Stripe Price ID (TEST)</label>
                                    <input
                                        type="text" value={editing.stripe_price_id_test}
                                        onChange={(e) => setEditing({ ...editing, stripe_price_id_test: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-rose-400 outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="price_..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Stripe Price ID (PROD)</label>
                                    <input
                                        type="text" value={editing.stripe_price_id_prod}
                                        onChange={(e) => setEditing({ ...editing, stripe_price_id_prod: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-emerald-400 outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="price_..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-8 pt-4">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-12 h-6 rounded-full relative transition-all ${editing.is_active ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'bg-slate-800'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editing.is_active ? 'left-7' : 'left-1'}`} />
                                    </div>
                                    <input type="checkbox" className="hidden" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">Pacchetto Attivo</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-12 h-6 rounded-full relative transition-all ${editing.is_recommended ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-slate-800'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editing.is_recommended ? 'left-7' : 'left-1'}`} />
                                    </div>
                                    <input type="checkbox" className="hidden" checked={editing.is_recommended} onChange={(e) => setEditing({ ...editing, is_recommended: e.target.checked })} />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">Consigliato</span>
                                </label>

                                <div className="flex-1 text-right">
                                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tighter">ID: {editing.id || 'NUOVO'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-800/30 border-t border-slate-800 flex gap-4">
                            <button
                                onClick={() => setEditing(null)}
                                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl transition-all text-xs uppercase tracking-widest"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Salva Pacchetto
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};



