
import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Coins, Plus, Edit2, Trash2, Save, X, Loader2, CheckCircle, Gift, Star, Zap, ShoppingBag, Utensils, Landmark, Monitor, Briefcase, Eye, AlertTriangle } from 'lucide-react';
import { getXpRulesAsync, getRewardsAsync, saveXpRule, saveReward, deleteReward, XpRule, Reward, LEVELS, RewardCategory } from '../../services/gamificationService';
import { useAdminStyles } from '../../hooks/useAdminStyles'; // IMPORTATO STYLES
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

// REPLICA ESATTA DELLA CARD UTENTE (VERTICALE)
// Extracted to avoid re-rendering and scope pollution
const RewardCardPreview = ({ reward }: { reward: Partial<Reward> }) => {
    // Configurazione colori (Replica di UserDashboard)
    const getCategoryTheme = (cat: string) => {
        switch(cat) {
            case 'food': return { bg: 'bg-amber-600', text: 'text-amber-500', icon: Utensils, modalHeader: 'bg-amber-600' };
            case 'culture': return { bg: 'bg-purple-600', text: 'text-purple-500', icon: Landmark, modalHeader: 'bg-purple-600' };
            case 'shopping': return { bg: 'bg-emerald-600', text: 'text-emerald-500', icon: ShoppingBag, modalHeader: 'bg-emerald-600' };
            case 'tech': return { bg: 'bg-blue-600', text: 'text-blue-500', icon: Monitor, modalHeader: 'bg-blue-600' };
            default: return { bg: 'bg-slate-600', text: 'text-slate-500', icon: Star, modalHeader: 'bg-slate-600' };
        }
    };

    const theme = getCategoryTheme(reward.category || 'general');
    const Icon = theme.icon;

    return (
        <div 
            className={`
                w-52 h-72 flex-shrink-0 rounded-xl border flex flex-col overflow-hidden relative transition-all duration-300
                opacity-100 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-xl
            `}
        >
            {/* Header Card */}
            <div className="p-4 flex justify-between items-start">
                <div className={`p-2 rounded-lg bg-slate-800 ${theme.text}`}>
                    <Icon className="w-6 h-6"/>
                </div>
                <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wide border bg-emerald-900/20 text-emerald-500 border-emerald-500/30`}>
                    LIV {reward.requiredLevel || 1}
                </span>
            </div>
            
            {/* Body Card */}
            <div className="px-4 flex-1">
                <h4 className="text-lg font-bold leading-tight mb-2 text-white">{reward.title || 'Titolo Premio'}</h4>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{reward.description || 'Descrizione premio...'}</p>
            </div>

            {/* Footer Card */}
            <div className="p-4 border-t border-slate-800/50 mt-auto">
                <button 
                    disabled
                    className="w-full py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all bg-indigo-600 text-white shadow-lg opacity-50 cursor-not-allowed"
                >
                    Anteprima
                </button>
            </div>
        </div>
    );
};

export const AdminGamification = () => {
    const [activeTab, setActiveTab] = useState<'rules' | 'rewards'>('rules');
    const [rules, setRules] = useState<XpRule[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const { styles } = useAdminStyles(); // USATO STILI DINAMICI
    
    // Edit States
    const [editingRule, setEditingRule] = useState<XpRule | null>(null);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingRewardId, setDeletingRewardId] = useState<string | null>(null);
    
    // Toast
    const [showToast, setShowToast] = useState(false);

    const refreshData = async () => {
        setIsLoading(true);
        const [rRules, rRewards] = await Promise.all([getXpRulesAsync(), getRewardsAsync()]);
        setRules(rRules);
        setRewards(rRewards);
        setIsLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, []);

    // ESC Key Handler for Modals
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (editingRule) setEditingRule(null);
                if (editingReward) setEditingReward(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingRule, editingReward]);

    const handleSaveRule = async () => {
        if(!editingRule) return;
        setIsSaving(true);
        try {
            await saveXpRule(editingRule);
            await refreshData();
            setEditingRule(null);
            triggerToast();
        } catch (error: any) {
             console.error(error);
             alert("Errore salvataggio regola: " + (error.message || "Sconosciuto"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveReward = async () => {
        if(!editingReward) return;
        setIsSaving(true);
        try {
            // Ensure ID
            const payload = { ...editingReward, id: editingReward.id || `rew_${Date.now()}` };
            await saveReward(payload);
            await refreshData();
            setEditingReward(null);
            triggerToast();
        } catch (error: any) {
            console.error(error);
            // INTERCETTAZIONE ERRORE RLS
            if (error.code === '42501' || error.message?.includes('violates row-level security')) {
                alert("ERRORE PERMESSI (42501): Il database ha bloccato la modifica.\n\nEsegui lo script SQL di sblocco permessi ('Fix Permessi Catalogo') nella chat per risolvere.");
            } else {
                alert("Errore salvataggio premio: " + (error.message || "Sconosciuto"));
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteReward = (id: string) => {
        setDeletingRewardId(id);
    };

    const executeDeleteReward = async () => {
        if(!deletingRewardId) return;
        setIsSaving(true);
        try {
            await deleteReward(deletingRewardId);
            await refreshData();
            triggerToast();
        } catch (error: any) {
            console.error(error);
             if (error.code === '42501' || error.message?.includes('violates row-level security')) {
                alert("ERRORE PERMESSI (42501): Impossibile eliminare. Esegui lo script SQL di fix.");
            } else {
                alert("Errore eliminazione: " + (error.message || "Sconosciuto"));
            }
        } finally {
            setIsSaving(false);
            setDeletingRewardId(null);
        }
    };
    
    const triggerToast = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const openNewReward = () => {
        setEditingReward({
            id: '',
            title: '',
            description: '',
            requiredLevel: 1,
            icon: 'Gift',
            type: 'partner',
            category: 'general',
            active: true
        });
    };
    
    const openNewRule = () => {
        setEditingRule({
             key: `custom_rule_${Date.now()}`,
             label: '',
             xp: 10,
             icon: 'Star',
             description: ''
        });
    };

    // LOGICA DI RAGGRUPPAMENTO PER LIVELLO
    const rewardsByLevel = useMemo(() => {
        const grouped: Record<number, Reward[]> = {};
        LEVELS.forEach(l => { grouped[l.level] = []; });
        
        rewards.forEach(r => {
            if (!grouped[r.requiredLevel]) grouped[r.requiredLevel] = [];
            grouped[r.requiredLevel].push(r);
        });
        return grouped;
    }, [rewards]);

    if (isLoading) return <div className="flex justify-center items-center h-full text-slate-500"><Loader2 className="w-10 h-10 animate-spin"/></div>;

    return (
        <div className="space-y-6 h-full flex flex-col animate-in fade-in relative">
            <DeleteConfirmationModal 
                isOpen={!!deletingRewardId}
                onClose={() => setDeletingRewardId(null)}
                onConfirm={executeDeleteReward}
                title="Elimina Premio"
                message="Eliminare definitivamente questo premio?"
                confirmLabel="Elimina"
                variant="danger"
            />
            {/* SUCCESS TOAST */}
            {showToast && (
                <div className="absolute top-4 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-2 border border-emerald-400 font-bold text-sm">
                    <CheckCircle className="w-5 h-5"/> Salvataggio Completato
                </div>
            )}
            
            {/* HEADER STILE MARKETING */}
            <div className="flex justify-between items-center mb-2 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-600 rounded-xl shadow-lg">
                        <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className={styles.admin_page_title}>Gamification & Premi</h2>
                        <p className={styles.admin_page_subtitle}>Gestisci le regole XP e il catalogo ricompense</p>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-fit shrink-0">
                <button onClick={() => setActiveTab('rules')} className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'rules' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                    <Zap className="w-4 h-4"/> Regole XP (Input)
                </button>
                <button onClick={() => setActiveTab('rewards')} className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'rewards' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                    <Gift className="w-4 h-4"/> Catalogo Premi (Output)
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900 rounded-2xl border border-slate-800 shadow-xl relative">
                
                {/* TAB: RULES XP */}
                {activeTab === 'rules' && (
                    <div className="p-6">
                        <div className="flex justify-end mb-4">
                             <button onClick={openNewRule} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2 shadow-lg transition-all">
                                <Plus className="w-4 h-4"/> Nuova Regola
                            </button>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                            <table className="w-full text-left border-collapse bg-slate-900">
                                <thead className="bg-[#0f172a]">
                                    <tr className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                                        <th className="py-4 pl-6">Key Sistema</th>
                                        <th className="py-4">Etichetta Visibile</th>
                                        <th className="py-4">Descrizione</th>
                                        <th className="py-4 text-center">XP</th>
                                        <th className="py-4 text-right pr-6">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {rules.map(rule => (
                                        <tr key={rule.key} className="hover:bg-slate-800/50 transition-colors group">
                                            <td className="py-4 pl-6 font-mono text-xs text-indigo-400">{rule.key}</td>
                                            <td className="py-4 font-bold text-white text-sm">{rule.label}</td>
                                            <td className="py-4 text-xs text-slate-400">{rule.description || '-'}</td>
                                            <td className="py-4 text-center">
                                                <span className="bg-amber-900/20 border border-amber-500/30 px-3 py-1 rounded-full text-amber-500 font-black text-xs shadow-sm">
                                                    +{rule.xp} XP
                                                </span>
                                            </td>
                                            <td className="py-4 text-right pr-6">
                                                <button onClick={() => setEditingRule(rule)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                                    <Edit2 className="w-4 h-4"/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* BOX INFORMATIVO AGGIORNATO (Text Size Increased) */}
                        <div className="mt-6 p-5 bg-slate-950 border border-slate-800 rounded-2xl flex gap-4 text-sm text-slate-400 shadow-inner">
                             <div className="p-2 bg-amber-900/20 rounded-lg h-fit border border-amber-500/20">
                                <AlertTriangle className="w-6 h-6 text-amber-500"/>
                             </div>
                             <div>
                                <h4 className="font-black text-amber-400 mb-2 uppercase tracking-wide text-base">Come funzionano le Regole?</h4>
                                <p className="leading-relaxed">
                                    Il database salva i valori (etichetta e punti XP). Tuttavia, l'azione che scatena l'assegnazione dei punti (es. "utente carica foto") deve essere programmata nel codice dell'app dallo sviluppatore usando la <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-400 font-mono">Key Sistema</code>. <br/>
                                    <strong className="text-slate-300">Creare una regola qui non la rende "magicamente" attiva nell'app se non c'è il codice che la chiama.</strong>
                                </p>
                             </div>
                        </div>
                    </div>
                )}

                {/* TAB: REWARDS - GROUPED BY LEVEL & VISUALLY IDENTICAL TO USER PROFILE */}
                {activeTab === 'rewards' && (
                    <div className="p-6 space-y-10">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">Catalogo Premi</h3>
                                <p className="text-slate-400 text-sm">Organizzato per livello di sblocco.</p>
                            </div>
                            <button onClick={openNewReward} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2 shadow-lg transition-all">
                                <Plus className="w-4 h-4"/> Nuovo Premio
                            </button>
                        </div>
                        
                        {Object.entries(rewardsByLevel).map(([levelStr, levelRewards]) => {
                            const level = parseInt(levelStr);
                            const levelInfo = LEVELS.find(l => l.level === level) || LEVELS[0];
                            const rewardsList = levelRewards as Reward[]; // Explicit cast for TS safety
                            
                            return (
                                <div key={level} className="relative">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl shadow-lg">
                                            {levelInfo.icon}
                                        </div>
                                        <div>
                                            <h4 className={`text-lg font-black uppercase tracking-wider ${levelInfo.color}`}>Livello {level}: {levelInfo.name}</h4>
                                            <p className="text-xs text-slate-500">Sbloccabile a {levelInfo.minXp} XP</p>
                                        </div>
                                        <div className="h-px flex-1 bg-slate-800"></div>
                                    </div>

                                    {rewardsList.length === 0 ? (
                                        <div className="text-slate-600 text-xs italic ml-14 mb-4">Nessun premio configurato per questo livello.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ml-4 md:ml-14">
                                            {rewardsList.map(reward => (
                                                <div key={reward.id} className="group relative">
                                                    {/* CARD IDENTICA ALL'UTENTE */}
                                                    <RewardCardPreview reward={reward} />
                                                    
                                                    {/* OVERLAY ACTIONS ADMIN */}
                                                    <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setEditingReward(reward)} className="p-1.5 bg-indigo-600 text-white rounded shadow hover:bg-indigo-500"><Edit2 className="w-3.5 h-3.5"/></button>
                                                        <button onClick={() => handleDeleteReward(reward.id)} className="p-1.5 bg-red-600 text-white rounded shadow hover:bg-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                                                    </div>
                                                    
                                                    {/* STATUS BADGE */}
                                                    {!reward.active && (
                                                        <div className="absolute inset-0 bg-slate-950/80 z-10 flex items-center justify-center rounded-xl border-2 border-slate-700 border-dashed">
                                                            <span className="text-slate-400 font-bold uppercase text-xs">Disattivato</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* EDIT RULE MODAL */}
                {editingRule && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 flex flex-col overflow-hidden">
                             <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-[#0f172a]">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500"/> Modifica Regola XP</h3>
                                <button onClick={() => setEditingRule(null)} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-lg"><X className="w-4 h-4"/></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Key Sistema</label><input value={editingRule.key} onChange={e => setEditingRule({...editingRule, key: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm outline-none focus:border-indigo-500" disabled={!editingRule.key.startsWith('custom')}/></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Etichetta</label><input value={editingRule.label} onChange={e => setEditingRule({...editingRule, label: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-bold outline-none focus:border-indigo-500"/></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">XP Assegnati</label><input type="number" value={editingRule.xp} onChange={e => setEditingRule({...editingRule, xp: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-amber-500 font-black text-lg outline-none focus:border-indigo-500"/></div>
                                <button onClick={handleSaveRule} disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg mt-2 flex items-center justify-center gap-2 transition-all active:scale-95">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Salva Modifiche
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* EDIT REWARD MODAL (SPLIT VIEW) */}
                {editingReward && (
                    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[2000] flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col md:flex-row overflow-hidden h-[85vh]">
                            
                            {/* LEFT: FORM */}
                            <div className="w-full md:w-[60%] p-6 md:p-8 overflow-y-auto custom-scrollbar border-r border-slate-800 bg-[#0f172a]">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><Gift className="w-5 h-5 text-emerald-500"/> Editor Premio</h3>
                                </div>

                                <div className="space-y-5">
                                    <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Titolo</label><input value={editingReward.title} onChange={e => setEditingReward({...editingReward, title: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-bold outline-none focus:border-emerald-500"/></div>
                                    <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Descrizione</label><textarea value={editingReward.description} onChange={e => setEditingReward({...editingReward, description: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none resize-none h-24 focus:border-emerald-500"/></div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Livello Richiesto</label>
                                            <select value={editingReward.requiredLevel} onChange={e => setEditingReward({...editingReward, requiredLevel: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-emerald-500 cursor-pointer">
                                                {LEVELS.map(l => <option key={l.level} value={l.level}>Liv. {l.level} - {l.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Categoria</label>
                                            <select value={editingReward.category} onChange={e => setEditingReward({...editingReward, category: e.target.value as any})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-emerald-500 cursor-pointer">
                                                <option value="general">Generale</option>
                                                <option value="food">Cibo & Drink</option>
                                                <option value="culture">Cultura</option>
                                                <option value="tech">Digital / Tech</option>
                                                <option value="shopping">Shopping</option>
                                                <option value="business">Business (B2B)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Tipo Partner</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingReward({...editingReward, type: 'internal'})} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${editingReward.type === 'internal' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>Interno</button>
                                            <button onClick={() => setEditingReward({...editingReward, type: 'partner'})} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${editingReward.type === 'partner' ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>Partner Esterno</button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <input type="checkbox" checked={editingReward.active !== false} onChange={e => setEditingReward({...editingReward, active: e.target.checked})} className="w-5 h-5 accent-emerald-500 cursor-pointer"/>
                                        <span className="text-sm text-slate-300 font-bold">Attivo e visibile nel catalogo</span>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: LIVE PREVIEW - SFONDO SCURO PER CONTRASTO */}
                            <div className="w-full md:w-[40%] bg-black/50 flex flex-col relative justify-between border-l border-slate-800">
                                <button onClick={() => setEditingReward(null)} className="absolute top-4 right-4 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-lg z-50"><X className="w-5 h-5"/></button>
                                
                                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-950 to-black">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Live Preview</h4>
                                    {/* LA CARD DEVE ESSERE BEN VISIBILE */}
                                    <div className="transform scale-110">
                                        <RewardCardPreview reward={editingReward} />
                                    </div>
                                </div>
                                
                                <div className="p-6 border-t border-slate-800 bg-slate-900">
                                    <button onClick={handleSaveReward} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>} Salva Premio
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
