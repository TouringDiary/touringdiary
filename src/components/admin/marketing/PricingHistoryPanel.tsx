import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { History, ArrowLeftRight, Clock, ShieldCheck, XCircle } from 'lucide-react';

interface PricingHistoryPanelProps {
    versions: any[];
    campaigns: any[];
    onAction: (action: string, id: string) => Promise<void>;
}

export const PricingHistoryPanel: React.FC<PricingHistoryPanelProps> = ({ versions, campaigns, onAction }) => {
    
    const typeMapping: Record<string, string> = {
        'tour_guide': 'Guide Turistiche',
        'tour_operator': 'Tour Operator',
        'travel_agency': 'Agenzie Viaggio',
        'local_sponsor': 'Sponsor Locali'
    };

    const getStatusBadge = (ver: any) => {
        const now = new Date();
        const start = ver.valid_from ? new Date(ver.valid_from) : null;
        const end = ver.valid_until ? new Date(ver.valid_until) : null;

        if (!start && !end) return <span className="bg-amber-900/30 text-amber-500 px-2 py-1 rounded text-[10px] font-black border border-amber-500/20">DRAFT</span>;
        if (start && start <= now && (!end || end >= now)) return <span className="bg-emerald-900/30 text-emerald-500 px-2 py-1 rounded text-[10px] font-black border border-emerald-500/20">ACTIVE</span>;
        if (end && end < now) return <span className="bg-slate-800 text-slate-500 px-2 py-1 rounded text-[10px] font-black">EXPIRED</span>;
        return <span className="bg-red-900/30 text-red-500 px-2 py-1 rounded text-[10px] font-black border border-red-500/20">CANCELLED</span>;
    };

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <History className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-black text-white uppercase italic tracking-wider">Pricing Audit Log (SSOT)</h3>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-slate-800/80">
                            <th className="p-4 border-b border-slate-700 text-slate-500 text-[10px] font-black uppercase">Piano</th>
                            <th className="p-4 border-b border-slate-700 text-slate-500 text-[10px] font-black uppercase">Durata</th>
                            <th className="p-4 border-b border-slate-700 text-slate-500 text-[10px] font-black uppercase">Prezzo</th>
                            <th className="p-4 border-b border-slate-700 text-slate-500 text-[10px] font-black uppercase">Flash</th>
                            <th className="p-4 border-b border-slate-700 text-slate-500 text-[10px] font-black uppercase">Pro</th>
                            <th className="p-4 border-b border-slate-700 text-slate-500 text-[10px] font-black uppercase">Campagna</th>
                            <th className="p-4 border-b border-slate-700 text-slate-500 text-[10px] font-black uppercase text-center">Stato</th>
                            <th className="p-4 border-b border-slate-700 text-slate-500 text-[10px] font-black uppercase">Periodo Validità</th>
                            <th className="p-4 border-b border-slate-700 text-slate-500 text-[10px] font-black uppercase text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {versions.map((ver) => {
                            const campaign = campaigns.find(c => c.id === ver.campaign_id);
                            const planName = ver.plans ? (Array.isArray(ver.plans) ? ver.plans[0]?.type : ver.plans.type) : 'Unknown';
                            
                            return (
                                <tr key={ver.id} className="hover:bg-slate-800/40 transition-colors group">
                                    <td className="p-4">
                                        <span className="text-xs font-bold text-white uppercase">{typeMapping[planName ?? ''] ?? planName ?? 'Unknown'}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded">{ver.duration_days} gg</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm font-black text-white">€{ver.price}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-bold text-indigo-400">{(ver.ai_limits as any)?.models?.flash || 0}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-bold text-amber-500">{(ver.ai_limits as any)?.models?.pro || 0}</span>
                                    </td>
                                    <td className="p-4">
                                        {campaign ? (
                                            <span className="bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded text-[10px] font-black border border-indigo-500/20 uppercase">
                                                {campaign.code}
                                            </span>
                                        ) : (
                                            <span className="text-slate-700 text-[10px] font-bold">—</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {getStatusBadge(ver)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                                            <Clock className="w-3 h-3" />
                                            <span>{ver.valid_from ? format(new Date(ver.valid_from), 'dd/MM/yy HH:mm') : 'Draft'}</span>
                                            <span>→</span>
                                            <span>{ver.valid_until ? format(new Date(ver.valid_until), 'dd/MM/yy HH:mm') : 'Indef.'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {ver.valid_until && (
                                                <button 
                                                    onClick={() => onAction('rollback', ver.id)}
                                                    className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700"
                                                    title="Ripristina questa versione"
                                                >
                                                    <ArrowLeftRight className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
