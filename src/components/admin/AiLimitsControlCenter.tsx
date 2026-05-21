
import React, { useState, useEffect } from 'react';
import { 
    Zap, ShieldAlert, Euro, Users, LayoutGrid, 
    Save, Search, Calendar, RefreshCcw, Loader2, 
    CheckCircle, AlertCircle, Trash2, Clock, Globe,
    ChevronRight, ArrowRight, ToggleLeft as Toggle, ToggleRight
} from 'lucide-react';
import { useAdminStyles } from '../../hooks/useAdminStyles';
import * as aiAdmin from '../../services/aiAdminService';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export const AiLimitsControlCenter = () => {
    const { styles } = useAdminStyles();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [data, setData] = useState<aiAdmin.AiAdminData | null>(null);
    
    // UI State for Sections
    const [searchEmail, setSearchEmail] = useState('');
    const [userList, setUserList] = useState<any[]>([]);
    const [sortBy, setSortBy] = useState<'registrationDate' | 'extraQuota' | 'expiresSoon'>('registrationDate');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [newExtraQuota, setNewExtraQuota] = useState(0);
    const [newExtraExpiry, setNewExtraExpiry] = useState('');

    const loadData = async () => {
        try {
            setIsLoading(true);
            const res = await aiAdmin.getAiAdminData();
            setData(res);
            
            // Load initial user list for extra quota
            const users = await aiAdmin.getAdminUsersPaged(sortBy, searchEmail);
            setUserList(users);
        } catch (e) {
            console.error("Error loading AI Admin data", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [sortBy, searchEmail]); // Ricarica lista utenti se cambiano filtri/ordinamento

    const handleSaveCost = async (model: string, cost: number) => {
        setIsSaving(`cost_${model}`);
        try {
            await aiAdmin.updateModelCosts(model, cost);
            await loadData();
        } catch (e) { console.error(e); }
        finally { setIsSaving(null); }
    };

    const handleSaveBudget = async (key: string, value: string) => {
        setIsSaving(key);
        try {
            await aiAdmin.updateAnonBudgets(key, value);
            await loadData();
        } catch (e) { console.error(e); }
        finally { setIsSaving(null); }
    };

    const handleUpdatePlanLimit = async (versionId: string, field: string, value: any) => {
        setIsSaving(`${versionId}_${field}`);
        try {
            await aiAdmin.updatePlanAiLimitField(versionId, field, value);
            await loadData();
        } catch (e) { console.error(e); }
        finally { setIsSaving(null); }
    };

    const handleApplyExtraQuota = async () => {
        if (!selectedUser) return;
        setIsSaving('extra_quota');
        try {
            await aiAdmin.updateUserExtraQuota(selectedUser.id, Number(newExtraQuota), newExtraExpiry || null);
            await loadData();
            setSelectedUser(null);
            setSearchEmail('');
        } catch (e) { console.error(e); }
        finally { setIsSaving(null); }
    };

    const handleToggleEmergency = async (current: boolean) => {
        setIsSaving('emergency');
        try {
            await aiAdmin.toggleEmergencyStop(!current);
            await loadData();
        } catch (e) { console.error(e); }
        finally { setIsSaving(null); }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                <p className={styles.admin_page_subtitle}>Caricamento AI Limits Manager...</p>
            </div>
        );
    }

    const emergencyStop = data?.globalSettings.find(s => s.key === 'ai_emergency_stop')?.value === 'true';

    return (
        <div className="space-y-8 animate-in fade-in pb-20">
            {/* Header */}
            <div className="flex items-center justify-between gap-6 mb-2">
                <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl shadow-xl ${emergencyStop ? 'bg-red-600' : 'bg-indigo-600'}`}>
                        <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className={styles.admin_page_title}>AI Limits Control Center</h1>
                        <p className={styles.admin_page_subtitle}>Gestione centralizzata budget, costi e pipeline di consumo</p>
                    </div>
                </div>

                {/* 7. EMERGENCY AI STOP SWITCH */}
                <div className={`p-1 rounded-2xl border transition-all flex items-center gap-3 pr-4 shadow-lg ${emergencyStop ? 'bg-red-950/40 border-red-500/50' : 'bg-slate-900 border-slate-700'}`}>
                    <button 
                        onClick={() => handleToggleEmergency(emergencyStop)}
                        disabled={isSaving === 'emergency'}
                        className={`p-3 rounded-xl transition-all ${emergencyStop ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
                    >
                        {isSaving === 'emergency' ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldAlert className="w-6 h-6" />}
                    </button>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-tighter ${emergencyStop ? 'text-red-400' : 'text-slate-500'}`}>
                            Platform Status
                        </p>
                        <p className={`text-xs font-bold ${emergencyStop ? 'text-white' : 'text-slate-300'}`}>
                            {emergencyStop ? 'STOP DI EMERGENZA ATTIVO' : 'SISTEMA OPERATIVO'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* 1. MODEL COSTS */}
                <SectionCard title="Costi Unitari Modelli" icon={Euro} subtitle="Prezzo per singola richiesta utilizzato per il calcolo dei budget anonimi.">
                    <div className="grid grid-cols-2 gap-4">
                        {['flash', 'pro'].map(model => {
                            const currentCost = data?.modelPrices.find(p => p.model === model)?.cost_per_request || 0;
                            return (
                                <div key={model} className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400">{model}</span>
                                        <Clock className="w-3 h-3 text-slate-600" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-bold text-white">€</span>
                                        <input 
                                            type="number" 
                                            step="0.001"
                                            defaultValue={currentCost}
                                            id={`cost_${model}`}
                                            className="w-full bg-transparent text-xl font-mono font-bold text-white focus:outline-none"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => handleSaveCost(model, parseFloat((document.getElementById(`cost_${model}`) as HTMLInputElement).value))}
                                        disabled={isSaving === `cost_${model}`}
                                        className="mt-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                    >
                                        {isSaving === `cost_${model}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        Salva Costo
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </SectionCard>

                {/* 2. ANONYMOUS DAILY BUDGET */}
                <SectionCard title="Budget Giornaliero Anonimi" icon={Globe} subtitle="Budget massimo aggregato piattaforma espresso in Euro. Superato il limite, l'AI è disabilitata per tutti i guest.">
                    <div className="space-y-4">
                       {['anon_flash_budget_eur', 'anon_pro_budget_eur', 'anon_guest_budget_ratio'].map(key => {
                           const val = data?.globalSettings.find(s => s.key === key)?.value || '0.0';
                           const isRatio = key === 'anon_guest_budget_ratio';

                           return (
                               <div key={key} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                                   <div>
                                       <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400">
                                           {key === 'anon_flash_budget_eur' ? 'Budget Google Flash' : key === 'anon_pro_budget_eur' ? 'Budget Google Pro' : 'Guest Budget Ratio (%)'}
                                       </span>
                                       <div className="flex items-center gap-2 mt-1">
                                           <span className="text-xl font-bold text-white">{isRatio ? '%' : '€'}</span>
                                           <input 
                                                type="number" 
                                                step={isRatio ? "0.01" : "1.0"}
                                                defaultValue={isRatio ? (parseFloat(val) * 100).toFixed(0) : val} 
                                                id={key}
                                                className="bg-transparent text-xl font-mono font-bold text-white focus:outline-none w-24"
                                           />
                                       </div>
                                   </div>
                                   <button 
                                        onClick={() => {
                                            const rawVal = (document.getElementById(key) as HTMLInputElement).value;
                                            const finalVal = isRatio ? (parseFloat(rawVal) / 100).toString() : rawVal;
                                            handleSaveBudget(key, finalVal);
                                        }}
                                        disabled={isSaving === key}
                                        className="p-4 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                                   >
                                       {isSaving === key ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                   </button>
                               </div>
                           );
                       })}
                    </div>
                </SectionCard>

            </div>

            {/* 3, 4, 5. PLAN LIMITS TABLES */}
            <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
                    <LayoutGrid className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Configurazione Piani Standard</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-850">
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800">Piano & Durata</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 text-center">3. Soft Daily Limit</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 text-center">4. Flash Monthly</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 text-center">4. Pro Monthly</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 text-center">5. Burst Fallback</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                             {data?.pricingVersions.map((ver) => {
                                 const limits = ver.ai_limits || {};
                                 const models = limits.models || {};
                                 const plan = Array.isArray(ver.plans) ? ver.plans[0] : ver.plans;
                                 
                                 return (
                                     <tr key={ver.id} className="hover:bg-slate-800/40 transition-colors">
                                         <td className="p-4">
                                             <div className="font-bold text-white">{plan?.name || 'Sconosciuto'}</div>
                                             <div className="text-[10px] text-slate-500 font-mono italic">{ver.duration_days} giorni - {ver.price}{ver.currency}</div>
                                         </td>
                                         <td className="p-4 text-center">
                                             <input 
                                                type="number"
                                                id={`soft_${ver.id}`}
                                                defaultValue={limits.soft_daily_limit || 0}
                                                className="w-16 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-center text-xs font-bold text-amber-500 focus:border-amber-500 outline-none"
                                             />
                                         </td>
                                         <td className="p-4 text-center">
                                            <input 
                                                type="number"
                                                id={`flash_${ver.id}`}
                                                defaultValue={models.flash || 0}
                                                className="w-20 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-center text-xs font-bold text-indigo-400 focus:border-indigo-500 outline-none"
                                             />
                                         </td>
                                         <td className="p-4 text-center">
                                            <input 
                                                type="number"
                                                id={`pro_${ver.id}`}
                                                defaultValue={models.pro || 0}
                                                className="w-16 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-center text-xs font-bold text-rose-500 focus:border-rose-500 outline-none"
                                             />
                                         </td>
                                         <td className="p-4 text-center">
                                            <button 
                                                onClick={() => handleUpdatePlanLimit(ver.id, 'burst_allowed', !limits.burst_allowed)}
                                                className={`p-2 rounded-lg transition-all border ${limits.burst_allowed ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                                            >
                                                {limits.burst_allowed ? <ToggleRight className="w-6 h-6" /> : <Toggle className="w-6 h-6" />}
                                            </button>
                                         </td>
                                         <td className="p-4 text-right">
                                             <button 
                                                disabled={isSaving?.startsWith(ver.id)}
                                                onClick={() => {
                                                    const soft = (document.getElementById(`soft_${ver.id}`) as HTMLInputElement).value;
                                                    const flash = (document.getElementById(`flash_${ver.id}`) as HTMLInputElement).value;
                                                    const pro = (document.getElementById(`pro_${ver.id}`) as HTMLInputElement).value;
                                                    
                                                    handleUpdatePlanLimit(ver.id, 'soft_daily_limit', soft);
                                                    handleUpdatePlanLimit(ver.id, 'models', { flash, pro });
                                                }}
                                                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg"
                                             >
                                                 {isSaving?.startsWith(ver.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                             </button>
                                         </td>
                                     </tr>
                                 );
                             })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 6. EXTRA QUOTA USER OVERRIDE */}
            <SectionCard title="6. Extra Quota Override" icon={Users} subtitle="Assegna un bonus temporaneo di richieste AI a un utente specifico. Ha la precedenza assoluta sul piano base.">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Search & List Section */}
                    <div className="w-full md:w-1/3 bg-slate-950/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                             <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input 
                                    type="text" 
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                    placeholder="Cerca email..." 
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:border-indigo-500 transition-all outline-none"
                                />
                            </div>
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-[10px] font-bold text-slate-400 outline-none"
                            >
                                <option value="registrationDate">Recenti</option>
                                <option value="extraQuota">Quota Max</option>
                                <option value="expiresSoon">In Scadenza</option>
                            </select>
                        </div>

                        <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                           {userList.map(u => (
                               <button 
                                    key={u.id} 
                                    onClick={() => {
                                        setSelectedUser(u);
                                        setNewExtraQuota(u.extra_quota || 0);
                                        setNewExtraExpiry(u.extra_quota_expires_at ? new Date(u.extra_quota_expires_at).toISOString().slice(0, 16) : '');
                                    }}
                                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${selectedUser?.id === u.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
                                >
                                   <div className="min-w-0 flex-1">
                                       <p className="text-xs font-bold text-white truncate">{u.name}</p>
                                       <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                                   </div>
                                   <div className="bg-slate-800 px-2 py-1 rounded text-center min-w-[30px]">
                                       <p className="text-[10px] font-bold text-indigo-400">{u.extra_quota || 0}</p>
                                   </div>
                               </button>
                           ))}
                           {userList.length === 0 && <p className="text-center text-[10px] text-slate-600 italic py-10">Nessun utente trovato</p>}
                        </div>
                    </div>

                    {/* Management Section */}
                    {selectedUser ? (
                        <div className="flex-1 bg-slate-900/50 p-8 rounded-3xl border border-indigo-500/30 animate-in zoom-in-95 duration-300">
                             <div className="flex items-center justify-between mb-8">
                                 <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-xl font-bold text-white">{selectedUser.name}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${selectedUser.role === 'admin_all' ? 'bg-purple-900/40 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>
                                            {selectedUser.role}
                                        </span>
                                    </div>
                                    <span className="text-xs text-indigo-400 font-mono">{selectedUser.email}</span>
                                 </div>
                                 <div className="bg-indigo-600/10 border border-indigo-500/20 px-4 py-2 rounded-2xl text-center">
                                     <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Quota Attuale</p>
                                     <p className="text-2xl font-black text-white">{selectedUser.extra_quota || 0}</p>
                                 </div>
                             </div>

                             <div className="grid grid-cols-2 gap-8 mb-8">
                                 <div className="space-y-2">
                                     <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Nuova Quota Totale</label>
                                     <input 
                                        type="number" 
                                        value={newExtraQuota}
                                        onChange={(e) => setNewExtraQuota(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-2xl font-bold text-indigo-400 outline-none focus:border-indigo-500 transition-all font-mono"
                                     />
                                 </div>
                                 <div className="space-y-2">
                                     <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Scadenza Override</label>
                                     <input 
                                        type="datetime-local" 
                                        value={newExtraExpiry}
                                        onChange={(e) => setNewExtraExpiry(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all font-mono"
                                     />
                                 </div>
                             </div>

                             <div className="flex gap-4">
                                <button 
                                    onClick={handleApplyExtraQuota}
                                    disabled={isSaving === 'extra_quota'}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all"
                                >
                                    {isSaving === 'extra_quota' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    APPLICA OVERRIDE
                                </button>
                                <button 
                                    onClick={() => setSelectedUser(null)}
                                    className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl transition-all"
                                >
                                    Chiudi
                                </button>
                             </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl p-20 text-slate-600 italic">
                             <div className="p-6 bg-slate-800/30 rounded-full mb-4">
                                <Users className="w-10 h-10 text-slate-700" />
                             </div>
                            Seleziona un utente dalla lista a sinistra per gestire la sua Extra Quota
                        </div>
                    )}
                </div>
            </SectionCard>

        </div>
    );
};

// Helper Sub-component
const SectionCard = ({ title, subtitle, icon: Icon, children }: { title: string, subtitle?: string, icon: any, children: React.ReactNode }) => {
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col h-full animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-slate-800 rounded-2xl text-indigo-400 border border-slate-700">
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">{title}</h3>
                    {subtitle && <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">{subtitle}</p>}
                </div>
            </div>
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
};
