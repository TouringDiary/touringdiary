import React, { useEffect, useRef, useState } from 'react';
import { 
    ShoppingBag, MousePointer2, Users, Package, Activity, 
    TrendingUp, BarChart3, PieChart, Layers, Loader2,
    LucideIcon, Calendar
} from 'lucide-react';
import { AffiliateAnalyticsStats, AffiliateFilterRange } from '../../../hooks/admin/useAffiliateAnalytics';
import { format } from 'date-fns';

interface AffiliateAnalyticsTabProps {
    range: AffiliateFilterRange;
    setRange: (range: AffiliateFilterRange) => void;
    customDates: { start: Date; end: Date } | null;
    setCustomDates: (dates: { start: Date; end: Date } | null) => void;
    stats: AffiliateAnalyticsStats;
    loading: boolean;
    isRefreshing: boolean;
    effectiveDates: { start: Date; end: Date } | null;
}

export const AffiliateAnalyticsTab = ({
    range, setRange, customDates, setCustomDates, stats, loading, isRefreshing, effectiveDates
}: AffiliateAnalyticsTabProps) => {
    const startInputRef = useRef<HTMLInputElement>(null);
    const endInputRef = useRef<HTMLInputElement>(null);
    const [draftStart, setDraftStart] = useState('');
    const [draftEnd, setDraftEnd] = useState('');

    useEffect(() => {
        if (effectiveDates?.start && effectiveDates?.end) {
            setDraftStart(format(effectiveDates.start, 'yyyy-MM-dd'));
            setDraftEnd(format(effectiveDates.end, 'yyyy-MM-dd'));
        }
    }, [effectiveDates]);

    const openDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
        if (ref.current?.showPicker) ref.current.showPicker();
        else ref.current?.focus();
    };

    const parseLocalDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const applyCustomDates = () => {
        if (!draftStart || !draftEnd) return;
        const start = parseLocalDate(draftStart);
        const end = parseLocalDate(draftEnd);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return;
        setCustomDates({ start, end });
    };

    const canApplyCustomDates = (() => {
        if (!draftStart || !draftEnd) return false;
        const start = parseLocalDate(draftStart);
        const end = parseLocalDate(draftEnd);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return false;
        
        if (effectiveDates) {
            return (
                draftStart !== format(effectiveDates.start, 'yyyy-MM-dd') ||
                draftEnd !== format(effectiveDates.end, 'yyyy-MM-dd')
            );
        }
        return true;
    })();

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500 py-20">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                <p className="font-bold uppercase tracking-widest text-[11px]">Analisi Click-Stream in corso...</p>
            </div>
        );
    }

    const topPartnerMax = stats.topPartners[0]?.count ?? 1;
    const topCategoryMax = stats.topCategories[0]?.count ?? 1;

    return (
        <div className={`space-y-8 animate-in fade-in duration-500 ${isRefreshing ? 'opacity-70' : ''}`}>
            {/* Filtri Temporali */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 p-2 rounded-xl border border-slate-800 gap-4 shrink-0">
                <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto custom-scrollbar">
                    {(['7d', '30d', '90d', 'year', 'custom'] as AffiliateFilterRange[]).map((r) => (
                        <button 
                            key={r}
                            onClick={() => setRange(r)} 
                            className={`px-4 md:px-6 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${range === r ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            {r === '7d' ? '7 Giorni' : r === '30d' ? '30 Giorni' : r === '90d' ? '90 Giorni' : r === 'year' ? 'Anno' : 'Personalizzato'}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 w-full md:w-auto">
                    <div className="flex items-center gap-1 min-w-0">
                        <button
                            type="button"
                            onClick={() => openDatePicker(startInputRef)}
                            className="flex items-center px-2 text-slate-500 hover:text-indigo-400 transition-colors shrink-0"
                            title="Data inizio"
                        >
                            <Calendar size={14} />
                        </button>
                        <input
                            ref={startInputRef}
                            type="date"
                            value={draftStart}
                            onChange={(e) => setDraftStart(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-bold text-white outline-none uppercase tracking-tighter cursor-pointer min-w-0"
                        />
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                        <button
                            type="button"
                            onClick={() => openDatePicker(endInputRef)}
                            className="flex items-center px-2 text-slate-500 hover:text-indigo-400 transition-colors shrink-0"
                            title="Data fine"
                        >
                            <Calendar size={14} />
                        </button>
                        <input
                            ref={endInputRef}
                            type="date"
                            value={draftEnd}
                            onChange={(e) => setDraftEnd(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-bold text-white outline-none uppercase tracking-tighter cursor-pointer min-w-0"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={applyCustomDates}
                        disabled={!canApplyCustomDates}
                        className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                    >
                        Applica
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    title="Click Totali" 
                    value={stats.totalClicks.toLocaleString()} 
                    sub={`${stats.trendPercent >= 0 ? '+' : ''}${Math.round(stats.trendPercent)}% vs periodo prec.`}
                    icon={MousePointer2}
                    color="indigo"
                />
                <KpiCard 
                    title="Partner Attivi" 
                    value={stats.activePartners.toString()} 
                    sub="Partner con almeno 1 click"
                    icon={Users}
                    color="amber"
                />
                <KpiCard 
                    title="Prodotti Cliccati" 
                    value={stats.clickedProducts.toString()} 
                    sub="Referral unici generati"
                    icon={Package}
                    color="blue"
                />
                <KpiCard 
                    title="Media Giornaliera" 
                    value={stats.avgClicksPerDay.toFixed(1)} 
                    sub="Click/Giorno nel periodo"
                    icon={Activity}
                    color="emerald"
                />
            </div>

            {/* Trend Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-12">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-400" /> Andamento Click Temporale
                    </h3>
                </div>
                <div className="h-48 flex items-end gap-1 md:gap-2 px-4">
                    {stats.dailyTrend.map((t, i) => {
                        const maxCount = Math.max(...stats.dailyTrend.map(d => d.count)) || 1;
                        const height = (t.count / maxCount) * 100;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all bg-slate-800 px-2 py-1 rounded text-[8px] font-black text-white whitespace-nowrap z-floating-panel border border-slate-700">
                                    {t.count} Click
                                </div>
                                <div 
                                    className="w-full bg-indigo-500/20 group-hover:bg-indigo-500/40 border-t border-indigo-500/50 transition-all duration-700 rounded-t-lg" 
                                    style={{ height: `${height}%` }}
                                />
                                {stats.dailyTrend.length <= 31 && (
                                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter rotate-45 mt-2 origin-left whitespace-nowrap">
                                        {t.date}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Top Lists Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Top Partners */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-amber-500" /> Top 10 Partner
                    </h3>
                    <div className="space-y-4">
                        {stats.topPartners.map((p, i) => (
                            <div key={p.id} className="space-y-1">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400 truncate max-w-[150px]">{p.id}</span>
                                    <span className="text-white">{p.count}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" 
                                        style={{ width: `${(p.count / topPartnerMax) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {stats.topPartners.length === 0 && <p className="text-slate-600 text-xs italic">Nessun dato disponibile</p>}
                    </div>
                </div>

                {/* Top Categories */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-emerald-500" /> Top Categorie
                    </h3>
                    <div className="space-y-4">
                        {stats.topCategories.map((c, i) => (
                            <div key={c.name} className="space-y-1">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400 truncate max-w-[150px]">{c.name}</span>
                                    <span className="text-white">{c.count}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
                                        style={{ width: `${(c.count / topCategoryMax) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {stats.topCategories.length === 0 && <p className="text-slate-600 text-xs italic">Nessun dato disponibile</p>}
                    </div>
                </div>

                {/* Source & Top Product */}
                <div className="space-y-8">
                    {/* Source Breakdown */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-500" /> Sorgenti Click
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(stats.sourcesBreakdown).map(([source, count]) => {
                                const countNum = count;
                                const percent = stats.totalClicks > 0 ? (countNum / stats.totalClicks) * 100 : 0;
                                return (
                                    <div key={source} className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400">{source}</span>
                                            <span className="text-white">{countNum} ({Math.round(percent)}%)</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" 
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Top Product Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 shadow-2xl text-white">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Prodotto Star</p>
                        <h4 className="text-xl font-black truncate mb-1">{stats.topProducts[0]?.id || 'Nessun Prodotto'}</h4>
                        <p className="text-sm font-bold opacity-90">{stats.topProducts[0]?.count || 0} Click Generati</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface KpiCardProps {
    title: string;
    value: string;
    sub: string;
    icon: LucideIcon;
    color: 'indigo' | 'amber' | 'blue' | 'emerald';
}

const KpiCard = ({ title, value, sub, icon: Icon, color }: KpiCardProps) => {
    const colors: Record<string, string> = {
        indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
        amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
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
