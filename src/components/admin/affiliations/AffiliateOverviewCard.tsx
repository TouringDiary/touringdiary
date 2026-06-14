import React, { useEffect, useRef, useState } from 'react';
import { ShoppingBag, TrendingUp, TrendingDown, MousePointer2, Package, Calendar, ChevronDown } from 'lucide-react';
import { AffiliateAnalyticsStats, AffiliateFilterRange } from '../../../hooks/admin/useAffiliateAnalytics';
import { format } from 'date-fns';

interface AffiliateOverviewCardProps {
    range: AffiliateFilterRange;
    setRange: (range: AffiliateFilterRange) => void;
    customDates: { start: Date; end: Date } | null;
    setCustomDates: (dates: { start: Date; end: Date } | null) => void;
    stats: AffiliateAnalyticsStats;
    loading: boolean;
    isRefreshing: boolean;
    effectiveDates: { start: Date; end: Date } | null;
}

export const AffiliateOverviewCard = ({
    range, setRange, customDates, setCustomDates, stats, loading, isRefreshing, effectiveDates
}: AffiliateOverviewCardProps) => {
    const startInputRef = useRef<HTMLInputElement>(null);
    const endInputRef = useRef<HTMLInputElement>(null);
    const rangeMenuRef = useRef<HTMLDivElement>(null);
    const [rangeOpen, setRangeOpen] = useState(false);
    const [draftStart, setDraftStart] = useState('');
    const [draftEnd, setDraftEnd] = useState('');

    useEffect(() => {
        if (effectiveDates?.start && effectiveDates?.end) {
            setDraftStart(format(effectiveDates.start, 'yyyy-MM-dd'));
            setDraftEnd(format(effectiveDates.end, 'yyyy-MM-dd'));
        }
    }, [effectiveDates]);

    useEffect(() => {
        if (!rangeOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (rangeMenuRef.current && !rangeMenuRef.current.contains(e.target as Node)) {
                setRangeOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [rangeOpen]);

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
        
        // Se siamo in un range predefinito, permettiamo di applicare se le date differiscono da quelle attuali
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
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl animate-pulse flex flex-col justify-center items-center gap-4">
                <div className="w-12 h-12 bg-slate-800 rounded-full"></div>
                <div className="h-4 w-32 bg-slate-800 rounded"></div>
            </div>
        );
    }

    const isPositive = stats.trendPercent >= 0;

    return (
        <div className={`bg-slate-900 border border-indigo-500/20 p-8 rounded-3xl shadow-xl relative group hover:border-indigo-500/40 transition-all overflow-hidden flex flex-col h-full ${isRefreshing ? 'opacity-70' : ''}`}>
            {/* Background Decoration */}
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <ShoppingBag size={120} />
            </div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Affiliazioni & Click</p>
                        
                        {/* Period Selector */}
                        <div className="relative" ref={rangeMenuRef}>
                            <button
                                type="button"
                                onClick={() => setRangeOpen((open) => !open)}
                                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-[8px] font-black text-slate-300 uppercase tracking-tighter transition-colors"
                            >
                                {range === '7d' ? '7gg' : range === '30d' ? '30gg' : range === '90d' ? '90gg' : range === 'year' ? 'Anno' : 'Custom'}
                                <ChevronDown size={8} />
                            </button>
                            {rangeOpen && (
                                <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded shadow-2xl z-floating-panel min-w-[100px] overflow-hidden">
                                    {(['7d', '30d', '90d', 'year', 'custom'] as AffiliateFilterRange[]).map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => {
                                                setRange(r);
                                                setRangeOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-1.5 text-[9px] font-bold uppercase transition-colors hover:bg-slate-700 ${range === r ? 'text-indigo-400 bg-slate-900' : 'text-slate-400'}`}
                                        >
                                            {r === '7d' ? '7 Giorni' : r === '30d' ? '30 Giorni' : r === '90d' ? '90 Giorni' : r === 'year' ? 'Anno' : 'Personalizzato'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <h3 className="text-4xl font-display font-bold text-white leading-none flex items-center gap-3">
                        {stats.totalClicks.toLocaleString()}
                        <span className={`text-sm font-black flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {Math.abs(Math.round(stats.trendPercent))}%
                        </span>
                    </h3>
                </div>
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                    <MousePointer2 size={24} />
                </div>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 relative z-10 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={() => openDatePicker(startInputRef)}
                        className="text-slate-500 hover:text-indigo-400 transition-colors shrink-0"
                        title="Data inizio"
                    >
                        <Calendar size={12} />
                    </button>
                    <input
                        ref={startInputRef}
                        type="date"
                        value={draftStart}
                        onChange={(e) => setDraftStart(e.target.value)}
                        className="bg-transparent border-none text-[9px] font-bold text-white outline-none uppercase w-full min-w-0 cursor-pointer"
                    />
                </div>
                <div className="flex items-center gap-1 min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={() => openDatePicker(endInputRef)}
                        className="text-slate-500 hover:text-indigo-400 transition-colors shrink-0"
                        title="Data fine"
                    >
                        <Calendar size={12} />
                    </button>
                    <input
                        ref={endInputRef}
                        type="date"
                        value={draftEnd}
                        onChange={(e) => setDraftEnd(e.target.value)}
                        className="bg-transparent border-none text-[9px] font-bold text-white outline-none uppercase w-full min-w-0 cursor-pointer"
                    />
                </div>
                <button
                    type="button"
                    onClick={applyCustomDates}
                    disabled={!canApplyCustomDates}
                    className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                    Applica
                </button>
            </div>

            <div className="space-y-4 mt-auto relative z-10">
                <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                        <ShoppingBag size={16} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Top Partner</p>
                        <p className="text-xs font-bold text-white truncate">{stats.topPartners[0]?.id || 'Nessuno'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <Package size={16} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Top Prodotto</p>
                        <p className="text-xs font-bold text-white truncate">{stats.topProducts[0]?.id || 'Nessuno'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
