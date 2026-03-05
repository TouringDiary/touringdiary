
import React, { useMemo } from 'react';
import { Loader2, ArrowUpDown, ChevronUp, ChevronDown, CheckCircle, XCircle, Edit3, UserX, UserCheck, Trash2, Lock, Shield, Briefcase, User as UserIcon, Zap, FlaskConical, Monitor, Info, Brain, Activity } from 'lucide-react';
import { User, UserRole } from '../../../types/users';
import { useAdminStyles } from '../../../hooks/useAdminStyles'; 
import { MarketingConfig } from '../../../types/models/Sponsor';
import { useSystemMessage } from '../../../hooks/useSystemMessage';
import { AI_COSTS } from '../../../services/aiUsageService'; // Import costi

type SortKey = keyof User;

interface Props {
    users: User[];
    isLoading: boolean;
    sortKey: SortKey;
    sortDir: 'asc' | 'desc';
    onSort: (key: SortKey) => void;
    currentUserId: string;
    onEdit: (u: User) => void;
    onStatusToggle: (u: User) => void;
    onDelete: (u: User) => void;
    canManage: (u: User) => boolean;
    limitsConfig: MarketingConfig['aiLimits'] | null;
}

export const UserTable = ({ users, isLoading, sortKey, sortDir, onSort, currentUserId, onEdit, onStatusToggle, onDelete, canManage, limitsConfig }: Props) => {
    
    const { styles } = useAdminStyles();
    const today = new Date().toISOString().split('T')[0];
    
    // FETCH LEGENDA DAL DB
    const { getText: getLegend } = useSystemMessage('admin_user_legend');
    const legendContent = getLegend();

    // CALCOLO TOTALI SITO (PONDERATI)
    const siteTotals = useMemo(() => {
        return users.reduce((acc, u) => {
            const lastAiDate = u.aiUsageFlash?.date || u.aiUsagePro?.date || '';
            const isToday = lastAiDate === today;
            
            if (isToday) {
                acc.flash += (u.aiUsageFlash?.count || 0);
                acc.pro += (u.aiUsagePro?.count || 0);
                // Calcolo Crediti Totali
                acc.credits += ((u.aiUsageFlash?.count || 0) * AI_COSTS.flash) + ((u.aiUsagePro?.count || 0) * AI_COSTS.pro);
            }
            return acc;
        }, { flash: 0, pro: 0, credits: 0 });
    }, [users, today]);

    const getRoleBadge = (role: UserRole) => {
        switch(role) {
            case 'admin_all': return <span className="flex items-center justify-center w-6 h-6 rounded bg-purple-900/50 text-purple-400 border border-purple-500/30" title="Admin"><Shield className="w-3.5 h-3.5"/></span>;
            case 'admin_limited': return <span className="flex items-center justify-center w-6 h-6 rounded bg-indigo-900/50 text-indigo-400 border border-indigo-500/30" title="Moderatore"><Shield className="w-3.5 h-3.5"/></span>;
            case 'business': return <span className="flex items-center justify-center w-6 h-6 rounded bg-blue-900/50 text-blue-400 border border-blue-500/30" title="Business"><Briefcase className="w-3.5 h-3.5"/></span>;
            default: return <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-800 text-slate-400 border border-slate-700" title="Utente"><UserIcon className="w-3.5 h-3.5"/></span>;
        }
    };
    
    const getUserLimit = (user: User) => {
        if (!limitsConfig) return 20; 
        let configKey = 'registered'; 
        if (user.role === 'guest') configKey = 'guest';
        if (user.role === 'business') configKey = 'shop'; 
        if (user.role === 'admin_all' || user.role === 'admin_limited') return 99999;
        // @ts-ignore
        return (limitsConfig[configKey] || 20) + (user.extraQuota || 0);
    };

    const SortIcon = ({ colKey }: { colKey: SortKey }) => {
        if (sortKey !== colKey) return <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-20 ml-1 inline"/>;
        return sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5 text-amber-500 ml-1 inline"/> : <ChevronDown className="w-2.5 h-2.5 text-amber-500 ml-1 inline"/>;
    };

    return (
        <div className="flex flex-col h-full gap-4">
            
            {/* 1. BARRA TOTALI SITO */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-lg shrink-0">
                <div className="flex items-center gap-3 px-2">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Activity className="w-4 h-4"/></div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Carico Sito (Oggi)</div>
                        <div className="text-xs text-slate-400">Crediti consumati: <strong className="text-white">{siteTotals.credits}</strong></div>
                    </div>
                </div>

                <div className="bg-slate-950/50 rounded-xl p-2 border border-slate-800 flex items-center justify-between px-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-500"/>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Flash (1x)</span>
                    </div>
                    <div className="text-xs font-mono font-bold text-white">
                        {siteTotals.flash}
                    </div>
                </div>

                <div className="bg-slate-950/50 rounded-xl p-2 border border-slate-800 flex items-center justify-between px-3">
                    <div className="flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-purple-500"/>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Pro (5x)</span>
                    </div>
                    <div className="text-xs font-mono font-bold text-white">
                        {siteTotals.pro}
                    </div>
                </div>
                
                <div className="flex items-center justify-end px-2 text-[10px] text-slate-500 italic">
                    *1 Pro = {AI_COSTS.pro} Flash
                </div>
            </div>

            {/* 2. TABELLA UTENTI */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col flex-1 min-h-0">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className={`bg-slate-950 text-slate-500 text-[9px] uppercase tracking-wider font-bold sticky top-0 z-10 border-b border-slate-800`}>
                                <th className="px-3 py-3 w-8"></th>
                                <th className="px-3 py-3 cursor-pointer hover:text-white group w-48" onClick={() => onSort('name')}>
                                    Utente <SortIcon colKey="name"/>
                                </th>
                                <th className="px-2 py-3 w-20 text-center">Ruolo</th>
                                <th className="px-2 py-3 w-20 text-center">Tipo</th>
                                
                                {/* 3 COLONNE AI */}
                                <th className="px-2 py-3 text-center w-20 text-amber-500 border-l border-slate-800/50" title="Richieste Flash (1 credito)">
                                    Flash
                                </th>
                                <th className="px-2 py-3 text-center w-20 text-purple-400" title="Richieste Pro (5 crediti)">
                                    Pro
                                </th>
                                <th className="px-2 py-3 text-center w-32 text-blue-400 border-r border-slate-800/50" title="Crediti Totali Usati / Limite">
                                    Crediti Usati
                                </th>

                                <th className="px-3 py-3 text-center cursor-pointer hover:text-white group w-24" onClick={() => onSort('status')}>
                                    Stato <SortIcon colKey="status"/>
                                </th>
                                <th className="px-3 py-3 w-24 text-right cursor-pointer hover:text-white group" onClick={() => onSort('registrationDate')}>
                                    Iscritto <SortIcon colKey="registrationDate"/>
                                </th>
                                <th className="px-3 py-3 text-right w-24 bg-slate-950 sticky right-0 shadow-[-5px_0_10px_rgba(0,0,0,0.2)]">
                                    Azioni
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-20 text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500"/>
                                            <span>Caricamento utenti...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.map(u => {
                                const isSelf = u.id === currentUserId;
                                const isProtected = u.id === 'u_admin_all';
                                const isEditable = canManage(u);
                                
                                const lastAiDate = u.aiUsageFlash?.date || u.aiUsagePro?.date || '';
                                const isToday = lastAiDate === today;
                                const flashCount = isToday ? (u.aiUsageFlash?.count || 0) : 0;
                                const proCount = isToday ? (u.aiUsagePro?.count || 0) : 0;
                                
                                // CALCOLO PONDERATO
                                const totalCredits = (flashCount * AI_COSTS.flash) + (proCount * AI_COSTS.pro);
                                const userLimit = getUserLimit(u);
                                const isLimitReached = totalCredits >= userLimit;

                                return (
                                    <tr key={u.id} className={`hover:bg-slate-800/40 transition-colors group ${isSelf ? 'bg-indigo-900/10' : ''}`}>
                                        <td className="px-3 py-2">
                                            <div className="w-7 h-7 rounded-full bg-slate-800 overflow-hidden border border-slate-700 relative">
                                                <img 
                                                    src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`} 
                                                    alt={u.name} 
                                                    className="w-full h-full object-cover"
                                                />
                                                {isSelf && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_#10b981]"></div></div>}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex flex-col max-w-[180px]">
                                                <div className="font-bold text-slate-200 truncate flex items-center gap-1">
                                                    {u.name} {isProtected && <Lock className="w-3 h-3 text-purple-500"/>}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono truncate">{u.email}</div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-2 py-2 text-center">
                                            {getRoleBadge(u.role)}
                                        </td>

                                        <td className="px-2 py-2 text-center">
                                            {u.isTestAccount ? (
                                                <span className="text-[9px] font-black text-amber-500 bg-amber-900/20 px-1.5 py-0.5 rounded uppercase">Test</span>
                                            ) : (
                                                <span className="text-[9px] font-black text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded uppercase">Prod</span>
                                            )}
                                        </td>
                                        
                                        {/* COLONNE AI */}
                                        <td className="px-2 py-2 text-center font-mono font-bold text-slate-300 border-l border-slate-800/50">
                                            {flashCount}
                                        </td>
                                        <td className="px-2 py-2 text-center font-mono font-bold text-purple-400">
                                            {proCount}
                                        </td>
                                        <td className="px-2 py-2 text-center border-r border-slate-800/50 bg-slate-950/30">
                                            <div className="flex flex-col items-center">
                                                <span className={`font-mono font-black ${isLimitReached ? 'text-red-500' : 'text-blue-400'}`}>
                                                    {totalCredits} <span className="text-slate-600 text-[10px]">/ {userLimit}</span>
                                                </span>
                                                <div className="w-16 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                                    <div className={`h-full ${isLimitReached ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} style={{ width: `${Math.min((totalCredits/userLimit)*100, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-3 py-2 text-center">
                                            {u.status === 'active' ? (
                                                <span className="text-[9px] text-emerald-500 font-black uppercase bg-emerald-900/10 px-2 py-0.5 rounded border border-emerald-500/20">Attivo</span>
                                            ) : (
                                                <span className="text-[9px] text-red-500 font-black uppercase bg-red-900/10 px-2 py-0.5 rounded border border-red-500/20">Sospeso</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right text-[10px] text-slate-500 font-mono">
                                            {new Date(u.registrationDate).toLocaleDateString()}
                                        </td>
                                        
                                        {/* AZIONI */}
                                        <td className="px-3 py-2 text-right sticky right-0 bg-[#0f172a] group-hover:bg-[#1e293b]">
                                            {isEditable ? (
                                                <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => onEdit(u)} className="p-1.5 rounded hover:bg-slate-700 text-indigo-400 transition-colors" title="Modifica"><Edit3 className="w-3.5 h-3.5"/></button>
                                                    <button onClick={() => onStatusToggle(u)} className={`p-1.5 rounded transition-colors ${u.status === 'active' ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-700' : 'text-emerald-500 hover:bg-emerald-900/30'}`} title="Sospendi/Attiva">{u.status === 'active' ? <UserX className="w-3.5 h-3.5"/> : <UserCheck className="w-3.5 h-3.5"/>}</button>
                                                    <button onClick={() => onDelete(u)} className="p-1.5 hover:bg-red-900/30 text-slate-600 hover:text-red-500 rounded transition-colors" title="Elimina"><Trash2 className="w-3.5 h-3.5"/></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end pr-2"><Lock className="w-3.5 h-3.5 text-slate-700"/></div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* LEGENDA DINAMICA (DATABASE DRIVEN) */}
                <div className="p-3 border-t border-slate-800 bg-slate-950/80">
                    <div 
                        className="text-[10px] leading-relaxed opacity-80"
                        dangerouslySetInnerHTML={{ __html: legendContent.body || 'Caricamento legenda...' }} 
                    />
                </div>
            </div>
        </div>
    );
};
