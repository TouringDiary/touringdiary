
import React, { useState, useEffect, useCallback } from 'react';
import { 
    Zap, ShieldAlert, Euro, Users, LayoutGrid, 
    Save, Search, Calendar, RefreshCcw, Loader2, 
    CheckCircle, AlertCircle, Trash2, Clock, Globe,
    ChevronRight, ArrowRight, ToggleLeft as Toggle, ToggleRight
} from 'lucide-react';
import { useAdminStyles } from '../../hooks/useAdminStyles';
import { AdminPageHeader } from './common/AdminPageHeader';
import { AdminSectionCard } from './common/AdminSectionCard';
import * as aiAdmin from '../../services/aiAdminService';

type AdminUserSortBy = 'registrationDate' | 'bonusTotal' | 'expiresSoon';

interface AiAdminUserListItem {
    id: string;
    name: string;
    email: string;
    role?: string;
    bonus_total: number;
    bonus_flash: number;
    bonus_pro: number;
    bonus_expires_at: string | null;
}

type PlanLimitField = 'soft_daily_limit' | 'burst_allowed' | 'models';
type PlanLimitValue = string | number | boolean | { flash: string | number; pro: string | number };

export const AiLimitsControlCenter = () => {
    const { styles } = useAdminStyles();
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isUserListLoading, setIsUserListLoading] = useState(false);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [data, setData] = useState<aiAdmin.AiAdminData | null>(null);
    
    // UI State for Sections
    const [searchEmail, setSearchEmail] = useState('');
    const [userList, setUserList] = useState<AiAdminUserListItem[]>([]);
    const [sortBy, setSortBy] = useState<AdminUserSortBy>('registrationDate');
    const [selectedUser, setSelectedUser] = useState<AiAdminUserListItem | null>(null);
    const [newFlashCredits, setNewFlashCredits] = useState(0);
    const [newProCredits, setNewProCredits] = useState(0);
    const [newExtraExpiry, setNewExtraExpiry] = useState('');
    const [extraQuotaNotice, setExtraQuotaNotice] = useState<string | null>(null);

    const [modelCostDrafts, setModelCostDrafts] = useState<Record<string, string>>({});
    const [budgetDrafts, setBudgetDrafts] = useState<Record<string, string>>({});
    const [planLimitDrafts, setPlanLimitDrafts] = useState<Record<string, { soft: string; flash: string; pro: string }>>({});

    const syncFormDrafts = useCallback((adminData: aiAdmin.AiAdminData) => {
        const costs: Record<string, string> = {};
        adminData.modelPrices.forEach(p => {
            costs[p.model] = String(p.cost_per_request ?? 0);
        });
        setModelCostDrafts(costs);

        const budgets: Record<string, string> = {};
        (['anon_flash_budget_eur', 'anon_pro_budget_eur', 'anon_guest_budget_ratio'] as const).forEach(key => {
            const val = adminData.globalSettings.find(s => s.key === key)?.value ?? '0.0';
            budgets[key] = key === 'anon_guest_budget_ratio'
                ? (parseFloat(val) * 100).toFixed(0)
                : val;
        });
        setBudgetDrafts(budgets);

        const plans: Record<string, { soft: string; flash: string; pro: string }> = {};
        adminData.pricingVersions.forEach(ver => {
            const limits = ver.ai_limits || {};
            const models = limits.models || {};
            plans[ver.id] = {
                soft: String(limits.soft_daily_limit ?? 0),
                flash: String(models.flash ?? 0),
                pro: String(models.pro ?? 0),
            };
        });
        setPlanLimitDrafts(plans);
    }, []);

    const loadAdminConfig = useCallback(async () => {
        try {
            setIsInitialLoading(true);
            const res = await aiAdmin.getAiAdminData();
            setData(res);
            syncFormDrafts(res);
        } catch (e) {
            console.error('Error loading AI Admin data', e);
        } finally {
            setIsInitialLoading(false);
        }
    }, [syncFormDrafts]);

    const loadUserList = useCallback(async (sort: AdminUserSortBy, search: string) => {
        try {
            setIsUserListLoading(true);
            const users = await aiAdmin.getAdminUsersPaged(sort, search);
            setUserList(users);
        } catch (e) {
            console.error('Error loading admin user list', e);
        } finally {
            setIsUserListLoading(false);
        }
    }, []);

    const refreshAll = useCallback(async () => {
        try {
            const res = await aiAdmin.getAiAdminData();
            setData(res);
            syncFormDrafts(res);
            const users = await aiAdmin.getAdminUsersPaged(sortBy, searchEmail);
            setUserList(users);
        } catch (e) {
            console.error('Error refreshing AI Admin data', e);
        }
    }, [sortBy, searchEmail, syncFormDrafts]);

    useEffect(() => {
        void loadAdminConfig();
    }, [loadAdminConfig]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadUserList(sortBy, searchEmail);
        }, 300);
        return () => window.clearTimeout(timer);
    }, [sortBy, searchEmail, loadUserList]);

    const handleSaveCost = async (model: string, cost: number) => {
        setIsSaving(`cost_${model}`);
        try {
            await aiAdmin.updateModelCosts(model, cost);
            await refreshAll();
        } catch (e) { console.error(e); }
        finally { setIsSaving(null); }
    };

    const handleSaveBudget = async (key: string, value: string) => {
        setIsSaving(key);
        try {
            await aiAdmin.updateAnonBudgets(key, value);
            await refreshAll();
        } catch (e) { console.error(e); }
        finally { setIsSaving(null); }
    };

    const handleUpdatePlanLimit = async (versionId: string, field: PlanLimitField, value: PlanLimitValue) => {
        setIsSaving(`${versionId}_${field}`);
        try {
            await aiAdmin.updatePlanAiLimitField(versionId, field, value);
            await refreshAll();
        } catch (e) { console.error(e); }
        finally { setIsSaving(null); }
    };

    const handleApplyExtraQuota = async () => {
        if (!selectedUser) return;

        const flashCredits = Number(newFlashCredits);
        const proCredits = Number(newProCredits);
        const flashValid = Number.isFinite(flashCredits) && flashCredits > 0;
        const proValid = Number.isFinite(proCredits) && proCredits > 0;

        if (!flashValid && !proValid) {
            setExtraQuotaNotice('Inserisci almeno un credito Flash o Pro maggiore di zero.');
            return;
        }

        setExtraQuotaNotice(null);
        setIsSaving('extra_quota');
        try {
            const expiresAt = newExtraExpiry ? new Date(newExtraExpiry).toISOString() : null;
            await aiAdmin.grantAdminWalletCredits(
                selectedUser.id,
                flashValid ? flashCredits : 0,
                proValid ? proCredits : 0,
                expiresAt,
            );
            await refreshAll();
            setSelectedUser(null);
            setNewFlashCredits(0);
            setNewProCredits(0);
            setNewExtraExpiry('');
        } catch (e) {
            console.error(e);
            const message =
                e && typeof e === 'object' && 'message' in e && typeof e.message === 'string'
                    ? e.message
                    : 'Errore durante l\'assegnazione bonus wallet.';
            setExtraQuotaNotice(message);
        } finally {
            setIsSaving(null);
        }
    };

    const handleToggleEmergency = async (current: boolean) => {
        setIsSaving('emergency');
        try {
            await aiAdmin.toggleEmergencyStop(!current);
            await refreshAll();
        } catch (e) { console.error(e); }
        finally { setIsSaving(null); }
    };

    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                <p className={styles.admin_page_subtitle}>Caricamento AI Limits Manager...</p>
            </div>
        );
    }

    const emergencyStop = data?.globalSettings.find(s => s.key === 'ai_emergency_stop')?.value === 'true';

    const emergencyActions = (
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
    );

    return (
        <div className="space-y-8 animate-in fade-in pb-20">
            <AdminPageHeader
                as="h1"
                icon={Zap}
                title="AI Limits Control Center"
                subtitle="Gestione centralizzata budget, costi e pipeline di consumo"
                accent={emergencyStop ? 'rose' : 'indigo'}
                actions={emergencyActions}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* 1. MODEL COSTS */}
                <AdminSectionCard
                    className="animate-in slide-in-from-bottom-2 duration-500"
                    title="Costi Unitari Modelli"
                    icon={Euro}
                    subtitle="Prezzo per singola richiesta utilizzato per il calcolo dei budget anonimi."
                >
                    <div className="grid grid-cols-2 gap-4">
                        {(['flash', 'pro'] as const).map(model => (
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
                                            value={modelCostDrafts[model] ?? ''}
                                            onChange={(e) => setModelCostDrafts(prev => ({ ...prev, [model]: e.target.value }))}
                                            className="w-full bg-transparent text-xl font-mono font-bold text-white focus:outline-none"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => handleSaveCost(model, parseFloat(modelCostDrafts[model] ?? '0'))}
                                        disabled={isSaving === `cost_${model}`}
                                        className="mt-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                    >
                                        {isSaving === `cost_${model}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        Salva Costo
                                    </button>
                                </div>
                            ))}
                    </div>
                </AdminSectionCard>

                {/* 2. ANONYMOUS DAILY BUDGET */}
                <AdminSectionCard
                    className="animate-in slide-in-from-bottom-2 duration-500"
                    title="Budget Giornaliero Anonimi"
                    icon={Globe}
                    subtitle="Budget massimo aggregato piattaforma espresso in Euro. Superato il limite, l'AI è disabilitata per tutti i guest."
                >
                    <div className="space-y-4">
                       {(['anon_flash_budget_eur', 'anon_pro_budget_eur', 'anon_guest_budget_ratio'] as const).map(key => {
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
                                                value={budgetDrafts[key] ?? ''}
                                                onChange={(e) => setBudgetDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                                                className="bg-transparent text-xl font-mono font-bold text-white focus:outline-none w-24"
                                           />
                                       </div>
                                   </div>
                                   <button 
                                        onClick={() => {
                                            const rawVal = budgetDrafts[key] ?? '0';
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
                </AdminSectionCard>
            </div>

            {/* 3, 4, 5. PLAN LIMITS TABLES */}
            <AdminSectionCard
                className="overflow-hidden shadow-2xl"
                title="Configurazione Piani Standard"
                icon={LayoutGrid}
            >
                <div className="overflow-x-auto -mx-6">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-850">
                                <th className={`p-4 border-b border-slate-800 ${styles.admin_table_head}`}>Piano & Durata</th>
                                <th className={`p-4 border-b border-slate-800 text-center ${styles.admin_table_head}`}>3. Soft Daily Limit</th>
                                <th className={`p-4 border-b border-slate-800 text-center ${styles.admin_table_head}`}>4. Flash Monthly</th>
                                <th className={`p-4 border-b border-slate-800 text-center ${styles.admin_table_head}`}>4. Pro Monthly</th>
                                <th className={`p-4 border-b border-slate-800 text-center ${styles.admin_table_head}`}>5. Burst Fallback</th>
                                <th className={`p-4 border-b border-slate-800 text-right ${styles.admin_table_head}`}>Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                             {data?.pricingVersions.map((ver) => {
                                 const limits = ver.ai_limits || {};
                                 const models = limits.models || {};
                                 const plan = Array.isArray(ver.plans) ? ver.plans[0] : ver.plans;
                                 const draft = planLimitDrafts[ver.id] ?? {
                                     soft: String(limits.soft_daily_limit ?? 0),
                                     flash: String(models.flash ?? 0),
                                     pro: String(models.pro ?? 0),
                                 };
                                 
                                 return (
                                     <tr key={ver.id} className="hover:bg-slate-800/40 transition-colors">
                                         <td className={`p-4 ${styles.admin_table_cell}`}>
                                             <div className="font-bold text-white">{plan?.name || 'Sconosciuto'}</div>
                                             <div className="text-[10px] text-slate-500 font-mono italic">{ver.duration_days} giorni - {ver.price}{ver.currency}</div>
                                         </td>
                                         <td className="p-4 text-center">
                                             <input 
                                                type="number"
                                                value={draft.soft}
                                                onChange={(e) => setPlanLimitDrafts(prev => ({
                                                    ...prev,
                                                    [ver.id]: { ...draft, soft: e.target.value },
                                                }))}
                                                className="w-16 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-center text-xs font-bold text-amber-500 focus:border-amber-500 outline-none"
                                             />
                                         </td>
                                         <td className="p-4 text-center">
                                            <input 
                                                type="number"
                                                value={draft.flash}
                                                onChange={(e) => setPlanLimitDrafts(prev => ({
                                                    ...prev,
                                                    [ver.id]: { ...draft, flash: e.target.value },
                                                }))}
                                                className="w-20 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-center text-xs font-bold text-indigo-400 focus:border-indigo-500 outline-none"
                                             />
                                         </td>
                                         <td className="p-4 text-center">
                                            <input 
                                                type="number"
                                                value={draft.pro}
                                                onChange={(e) => setPlanLimitDrafts(prev => ({
                                                    ...prev,
                                                    [ver.id]: { ...draft, pro: e.target.value },
                                                }))}
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
                                                    handleUpdatePlanLimit(ver.id, 'soft_daily_limit', draft.soft);
                                                    handleUpdatePlanLimit(ver.id, 'models', { flash: draft.flash, pro: draft.pro });
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
            </AdminSectionCard>

            {/* Wallet BONUS grant panel */}
            <AdminSectionCard
                className="animate-in slide-in-from-bottom-2 duration-500"
                title="ADMIN BONUS CREDITS"
                icon={Users}
                subtitle="Aggiungi crediti bonus wallet (Flash e/o Pro) a un utente. Ogni assegnazione è additiva e finisce nel bucket BONUS runtime."
            >
                {extraQuotaNotice && (
                    <div className="mb-4 p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 text-[11px] text-rose-200">
                        {extraQuotaNotice}
                    </div>
                )}
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
                                onChange={(e) => setSortBy(e.target.value as AdminUserSortBy)}
                                className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-[10px] font-bold text-slate-400 outline-none"
                            >
                                <option value="registrationDate">Recenti</option>
                                <option value="bonusTotal">Bonus Max</option>
                                <option value="expiresSoon">Bonus in Scadenza</option>
                            </select>
                        </div>

                        <div className="relative space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                           {isUserListLoading && (
                               <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-950/40 backdrop-blur-[1px]">
                                   <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                               </div>
                           )}
                           {userList.map(u => (
                               <button 
                                    key={u.id} 
                                    onClick={() => {
                                        setSelectedUser(u);
                                        setNewFlashCredits(0);
                                        setNewProCredits(0);
                                        setNewExtraExpiry('');
                                        setExtraQuotaNotice(null);
                                    }}
                                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${selectedUser?.id === u.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
                                >
                                   <div className="min-w-0 flex-1">
                                       <p className="text-xs font-bold text-white truncate">{u.name}</p>
                                       <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                                   </div>
                                   <div className="bg-slate-800 px-2 py-1 rounded text-center min-w-[30px]">
                                       <p className="text-[10px] font-bold text-amber-400">{u.bonus_total || 0}</p>
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
                                 <div className="bg-amber-600/10 border border-amber-500/20 px-4 py-2 rounded-2xl text-center">
                                     <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Bonus wallet attivo</p>
                                     <p className="text-2xl font-black text-white">{selectedUser.bonus_total || 0}</p>
                                     <p className="text-[9px] text-amber-300/80 mt-1 font-mono">
                                         F {selectedUser.bonus_flash || 0} · P {selectedUser.bonus_pro || 0}
                                     </p>
                                 </div>
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                 <div className="space-y-2">
                                     <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Flash da aggiungere (BONUS)</label>
                                     <input
                                        type="number"
                                        min={0}
                                        value={newFlashCredits}
                                        onChange={(e) => setNewFlashCredits(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-2xl font-bold text-indigo-400 outline-none focus:border-indigo-500 transition-all font-mono"
                                     />
                                 </div>
                                 <div className="space-y-2">
                                     <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Pro da aggiungere (BONUS)</label>
                                     <input
                                        type="number"
                                        min={0}
                                        value={newProCredits}
                                        onChange={(e) => setNewProCredits(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-2xl font-bold text-rose-400 outline-none focus:border-rose-500 transition-all font-mono"
                                     />
                                 </div>
                                 <div className="space-y-2 sm:col-span-2">
                                     <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Scadenza bonus (opzionale, default 365g)</label>
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
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all"
                                >
                                    {isSaving === 'extra_quota' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    ASSEGNA BONUS
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
                            Seleziona un utente dalla lista a sinistra per assegnare bonus wallet
                        </div>
                    )}
                </div>
            </AdminSectionCard>

        </div>
    );
};
