import React from 'react';
import { Plus, Zap, CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface PricingPlansPanelProps {
    plansData: any[];
    onAction: (action: string, id: string, data?: any) => Promise<void>;
}

export const PricingPlansPanel: React.FC<PricingPlansPanelProps> = ({ plansData, onAction }) => {
    
    const getStatusInfo = (ver: any) => {
        const now = new Date();
        const start = ver.valid_from ? new Date(ver.valid_from) : null;
        const end = ver.valid_until ? new Date(ver.valid_until) : null;

        if (!start && !end) return { label: 'DRAFT', color: 'bg-amber-500/20 text-amber-500 border-amber-500/30' };
        if (start && start <= now && (!end || end >= now)) return { label: 'ACTIVE', color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' };
        if (end && end < now) return { label: 'EXPIRED', color: 'bg-slate-700/50 text-slate-500 border-slate-700' };
        return { label: 'CANCELLED', color: 'bg-red-500/20 text-red-500 border-red-500/30' };
    };

    const typeMapping: Record<string, string> = {
        'tour_guide': 'Guide Turistiche',
        'tour_operator': 'Tour Operator',
        'travel_agency': 'Agenzie Viaggio',
        'local_sponsor': 'Sponsor Locali'
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in duration-500">
            {plansData.map((group, gIdx) => (
                <div key={gIdx} className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur-sm">
                    <div className="p-6 bg-slate-800/40 border-b border-slate-700/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
                                <CreditCard className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">
                                {typeMapping[group.planName ?? ''] ?? group.planName ?? 'Unknown'}
                            </h3>
                        </div>
                        <button 
                            onClick={() => onAction('create_draft', group.versions[0]?.plan_id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
                        >
                            <Plus className="w-4 h-4" /> NUOVA VERSIONE
                        </button>
                    </div>

                    <div className="divide-y divide-slate-800/50">
                        {group.versions.filter((v: any) => !v.valid_until || new Date(v.valid_until) >= new Date()).map((ver: any) => {
                            const status = getStatusInfo(ver);
                            const isDraft = status.label === 'DRAFT';
                            
                            return (
                                <div key={ver.id} className="p-6 hover:bg-slate-800/20 transition-all group">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-black text-white">€{ver.price}</span>
                                                <span className="text-slate-500 font-mono text-sm uppercase">/ {ver.duration_days} giorni</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50 flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Flash</span>
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="w-3 h-3 text-indigo-400" />
                                                        <span className="text-sm font-black text-white">{ver.ai_limits?.models?.flash || 0}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50 flex flex-col gap-1">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Pro</span>
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="w-3 h-3 text-amber-500" />
                                                        <span className="text-sm font-black text-white">{ver.ai_limits?.models?.pro || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-row md:flex-col gap-2 shrink-0">
                                            {isDraft ? (
                                                <>
                                                    <button 
                                                        onClick={() => onAction('activate', ver.id)}
                                                        className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                                                    >
                                                        <CheckCircle className="w-4 h-4" /> Pubblica
                                                    </button>
                                                    <button 
                                                        onClick={() => onAction('delete_draft', ver.id)}
                                                        className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-xl text-xs font-black uppercase tracking-tighter transition-all border border-slate-700"
                                                    >
                                                        Elimina
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => onAction('cancel', ver.id)}
                                                    className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-xl text-xs font-black uppercase tracking-tighter transition-all border border-slate-700"
                                                >
                                                    Sospendi Versione
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};
