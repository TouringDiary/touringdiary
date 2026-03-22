import React, { useMemo } from 'react';
import { Loader2, ArrowUpDown, ChevronUp, ChevronDown, Edit3, UserX, UserCheck, Trash2, Shield, Briefcase, User as UserIcon, Zap, Brain, Activity } from 'lucide-react';
import { User, UserRole } from '../../../types/users';
import { useAdminStyles } from '../../../hooks/useAdminStyles'; 
import { MarketingConfig } from '../../../types/models/Sponsor';
import { useSystemMessage } from '../../../hooks/useSystemMessage';

type SortKey = keyof User;

const FLASH_COST = 1;
const PRO_COST = 5;

interface AiLimits {
  guest?: number;
  registered?: number;
  shop?: number;
}

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
    
    const { getText: getLegend } = useSystemMessage('admin_user_legend');
    const legendContent = getLegend();

    const siteTotals = useMemo(() => {
        return users.reduce((acc, u) => {
            const lastAiDate = u.aiUsageFlash?.date || u.aiUsagePro?.date || '';
            const isToday = lastAiDate === today;
            
            if (isToday) {
                acc.flash += (u.aiUsageFlash?.count || 0);
                acc.pro += (u.aiUsagePro?.count || 0);
                acc.credits += ((u.aiUsageFlash?.count || 0) * FLASH_COST) + ((u.aiUsagePro?.count || 0) * PRO_COST);
            }
            return acc;
        }, { flash: 0, pro: 0, credits: 0 });
    }, [users, today]);

    const getRoleBadge = (role: UserRole) => {
        switch(role) {
            case 'admin_all': return <span className="flex items-center justify-center w-6 h-6 rounded bg-purple-900/50 text-purple-400 border border-purple-500/30"><Shield className="w-3.5 h-3.5"/></span>;
            case 'admin_limited': return <span className="flex items-center justify-center w-6 h-6 rounded bg-indigo-900/50 text-indigo-400 border border-indigo-500/30"><Shield className="w-3.5 h-3.5"/></span>;
            case 'business': return <span className="flex items-center justify-center w-6 h-6 rounded bg-blue-900/50 text-blue-400 border border-blue-500/30"><Briefcase className="w-3.5 h-3.5"/></span>;
            default: return <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-800 text-slate-400 border border-slate-700"><UserIcon className="w-3.5 h-3.5"/></span>;
        }
    };
    
    const getUserLimit = (user: User) => {
        let configKey: keyof AiLimits = 'registered';
        if (user.role === 'guest') configKey = 'guest';
        if (user.role === 'business') configKey = 'shop';
        if (user.role === 'admin_all' || user.role === 'admin_limited') return 99999;
        
        const typedLimits = limitsConfig as AiLimits;

        return (typedLimits?.[configKey] ?? 20) + (user.extraQuota ?? 0);
    };

    const SortIcon = ({ colKey }: { colKey: SortKey }) => {
        if (sortKey !== colKey) return <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-20 ml-1 inline"/>;
        return sortDir === 'asc'
            ? <ChevronUp className="w-2.5 h-2.5 text-amber-500 ml-1 inline"/>
            : <ChevronDown className="w-2.5 h-2.5 text-amber-500 ml-1 inline"/>;
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header section with stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-lg shrink-0 mb-4">
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
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Flash</span>
                    </div>
                    <div className="text-xs font-mono font-bold text-white">{siteTotals.flash}</div>
                </div>
                <div className="bg-slate-950/50 rounded-xl p-2 border border-slate-800 flex items-center justify-between px-3">
                    <div className="flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-purple-500"/>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Pro</span>
                    </div>
                    <div className="text-xs font-mono font-bold text-white">{siteTotals.pro}</div>
                </div>
                <div className="flex items-center justify-end px-2 text-[10px] text-slate-500 italic">*1 Pro = {PRO_COST} Flash</div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="sticky top-0 bg-slate-900/50 backdrop-blur-sm z-10">
                        <tr>
                            <th className="p-3 font-semibold" onClick={() => onSort('name')}>Utente <SortIcon colKey='name' /></th>
                            <th className="p-3 font-semibold" onClick={() => onSort('registrationDate')}>Registrato <SortIcon colKey='registrationDate' /></th>
                            <th className="p-3 font-semibold text-center">AI Oggi (F/P)</th>
                            <th className="p-3 font-semibold text-center">Quota</th>
                            <th className="p-3 font-semibold text-center">Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                                <td className="p-3 flex items-center gap-3">
                                    {getRoleBadge(user.role)}
                                    <div>
                                        <div className="font-bold text-white">{user.name || 'N/D'}</div>
                                        <div className="text-slate-500">{user.email || 'N/D'}</div>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div>{new Date(user.registrationDate).toLocaleDateString()}</div>
                                    <div className="text-slate-500">Ultimo accesso: {user.lastAccess ? new Date(user.lastAccess).toLocaleDateString() : 'Mai'}</div>
                                </td>
                                <td className="p-3 text-center font-mono">
                                    <div>
                                        <span className="text-amber-400">{(user.aiUsageFlash?.date === today ? user.aiUsageFlash.count : 0)}</span> /
                                        <span className="text-purple-400"> {(user.aiUsagePro?.date === today ? user.aiUsagePro.count : 0)}</span>
                                    </div>
                                </td>
                                <td className="p-3 text-center font-mono">{getUserLimit(user)}</td>
                                <td className="p-3">
                                    <div className="flex items-center justify-center gap-1">
                                        <button 
                                            onClick={() => onEdit(user)} 
                                            className="group w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 hover:bg-slate-700">
                                            <Edit3 className="w-4 h-4 text-blue-400 transition-colors group-hover:text-blue-300"/>
                                        </button>
                                        <button 
                                            onClick={() => onStatusToggle(user)} 
                                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 hover:bg-slate-700">
                                            {user.status === 'active' 
                                                ? <UserCheck className="w-4 h-4 text-green-500"/> 
                                                : <UserX className="w-4 h-4 text-yellow-500"/>}
                                        </button>
                                        <button 
                                            onClick={() => onDelete(user)} 
                                            disabled={!canManage(user)} 
                                            className="group w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                                            <Trash2 className="w-4 h-4 text-red-500 transition-colors group-hover:text-red-400"/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && !isLoading && (
                    <div className="text-center p-8 text-slate-500">Nessun utente trovato.</div>
                )}
            </div>
        </div>
    );
};
