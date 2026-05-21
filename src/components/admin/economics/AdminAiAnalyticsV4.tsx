import type { User } from '@/types/users';
import React, { useState, useEffect } from 'react';
import { 
    Zap, Euro, TrendingUp, TrendingDown, Activity, 
    BarChart3, Users, Calendar, ArrowRight, Loader2,
    PieChart, DollarSign, Calculator, Info, ShieldCheck,
    MousePointer2, Sparkles
} from 'lucide-react';
import { getAiEconomicsStatsV4 } from '@/services/aiAdminService';

export const AdminAiAnalyticsV4 = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getAiEconomicsStatsV4();
            setData(res);
        } catch (err) {
            console.error("Failed to load analytics", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading || !data) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4 animate-pulse">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aggregazione Big Data Economici...</span>
            </div>
        );
    }

    const marginPercent = data.revenue_30d > 0 ? (data.margin_30d / data.revenue_30d) * 100 : 0;

    return (
        <div className="space-y-8 pb-24">
            {/* KPI Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    title="Ricavi Totali (30d)" 
                    value={`€${data.revenue_30d.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`} 
                    sub="Sub + Extra Credits"
                    icon={Euro}
                    color="indigo"
                />
                <KpiCard 
                    title="Costi API (30d)" 
                    value={`€${data.costs_30d.toLocaleString('it-IT', { minimumFractionDigits: 4 })}`} 
                    sub="Basato su Log Reali"
                    icon={Zap}
                    color="amber"
                />
                <KpiCard 
                    title="Margine Netto" 
                    value={`€${data.margin_30d.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`} 
                    sub={`${marginPercent.toFixed(1)}% di redditività`}
                    icon={TrendingUp}
                    color={marginPercent > 30 ? 'emerald' : 'rose'}
                />
                <KpiCard 
                    title="Richieste AI" 
                    value={data.feature_stats?.reduce((acc: any, s: any) => acc + s.request_count, 0).toLocaleString()} 
                    sub="Totale ultimi 30 giorni"
                    icon={Activity}
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Feature Breakdown */}
                <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-8 border-b border-slate-800/50 pb-4">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-indigo-400" /> Efficienza per Feature (30 Giorni)
                        </h3>
                        <span className="text-[10px] font-bold text-slate-500">Token Medi & Costi</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    <th className="pb-4">Feature</th>
                                    <th className="pb-4 text-center">Richieste</th>
                                    <th className="pb-4 text-center">Token Medi</th>
                                    <th className="pb-4 text-center">Costo Tot.</th>
                                    <th className="pb-4 text-right">Margine Est.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {data.feature_stats?.map((s: any) => (
                                    <tr key={s.feature_name} className="group">
                                        <td className="py-4">
                                            <span className="text-sm font-black text-white uppercase tracking-tight">{s.feature_name}</span>
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className="text-xs font-bold text-slate-400">{s.request_count}</span>
                                        </td>
                                        <td className="py-4 text-center">
                                             <div className="flex flex-col items-center">
                                                <span className="text-xs font-black text-indigo-400">{s.avg_tokens.toLocaleString()}</span>
                                                <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">per req</span>
                                             </div>
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className="text-xs font-black text-white">€{s.total_cost.toFixed(2)}</span>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 text-emerald-400">
                                                <TrendingUp className="w-3 h-3" />
                                                <span className="text-xs font-black">Healthy</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* User Type Breakdown */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
                    <div className="flex items-center justify-between mb-8 border-b border-slate-800/50 pb-4">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-400" /> User Segmentation
                        </h3>
                    </div>

                    <div className="space-y-6 flex-1">
                        {data.user_type_stats?.map((s: any) => {
                            const percent = (s.total_cost / data.costs_30d) * 100;
                            return (
                                <div key={s.user_role} className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-400">{s.user_role}</span>
                                        <span className="text-white">€{s.total_cost.toFixed(2)} ({percent.toFixed(0)}%)</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${s.user_role === 'guest' ? 'bg-slate-600' : 'bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.4)]'}`} 
                                            style={{ width: `${percent}%` }} 
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-3 bg-indigo-500/5 p-4 rounded-2xl">
                        <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                            Monitora i Guest per evitare perdite API non compensate da abbonamenti o pubblicità.
                        </p>
                    </div>
                </div>
            </div>

            {/* Daily Trends Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
                <div className="flex items-center justify-between mb-12">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-500" /> Trend Spesa Giornaliera (14gg)
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Costo API</span>
                        </div>
                    </div>
                </div>

                <div className="h-48 flex items-end gap-2 md:gap-4 px-4">
                    {data.daily_trends?.map((t: any, i: number) => {
                        const maxCost = Math.max(...data.daily_trends.map((d: any) => d.cost)) || 1;
                        const height = (t.cost / maxCost) * 100;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all bg-slate-800 px-2 py-1 rounded text-[8px] font-black text-white whitespace-nowrap z-floating-panel border border-slate-700">
                                    €{t.cost.toFixed(2)}
                                </div>
                                <div 
                                    className="w-full bg-indigo-500/20 group-hover:bg-indigo-500/40 border-t border-indigo-500/50 transition-all duration-700 rounded-t-lg" 
                                    style={{ height: `${height}%` }}
                                />
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter rotate-45 mt-2 origin-left">
                                    {new Date(t.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const KpiCard = ({ title, value, sub, icon: Icon, color }: any) => {
    const colors: Record<string, string> = {
        indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
        amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        rose: "bg-rose-500/10 border-rose-500/20 text-rose-400",
        purple: "bg-purple-500/10 border-purple-500/20 text-purple-400"
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</span>
                <div className={`p-2 rounded-xl ${colors[color]}`}>
                    <Icon size={16} />
                </div>
            </div>
            <div className="space-y-1">
                <div className="text-2xl font-black text-white tracking-tight">{value}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{sub}</div>
            </div>
        </div>
    );
};
