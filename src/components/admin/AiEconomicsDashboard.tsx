
import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Zap,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Info,
    Calculator,
    Leaf,
    Sun,
    CloudRain,
    Snowflake,
    ShieldAlert,
    BarChart3,
    Euro,
    type LucideIcon,
} from 'lucide-react';
import * as aiAdmin from '../../services/aiAdminService';
import type { AiEconomicsDashboardData, AiModelPrice, AiSeasonKey, AiUserCostCategory } from '../../services/aiAdminService';
import { AdminPageHeader } from './common/AdminPageHeader';

interface SectionCardProps {
    title: string;
    icon: LucideIcon;
    subtitle?: string;
    children: React.ReactNode;
}

const SectionCard = ({ title, icon: Icon, subtitle, children }: SectionCardProps) => (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-indigo-500/50 transition-all duration-500">
        <div className="absolute -right-8 -top-8 bg-indigo-600/5 w-32 h-32 rounded-full blur-3xl group-hover:bg-indigo-600/10 transition-all" />

        <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-500/20">
                    <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white leading-tight">{title}</h3>
                    {subtitle && <p className="text-[10px] text-slate-500 font-medium mt-0.5">{subtitle}</p>}
                </div>
            </div>
        </div>
        {children}
    </div>
);

interface KpiCardProps {
    label: string;
    value: number | string;
    subValue?: string;
    trend?: number;
    prefix?: string;
}

const KpiCard = ({ label, value, subValue, trend, prefix = '€' }: KpiCardProps) => (
    <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 flex flex-col gap-1">
        <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">{label}</span>
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">{prefix}{typeof value === 'number' ? value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}</span>
            {trend !== undefined && (
                <div className={`flex items-center text-[10px] font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(trend).toFixed(1)}%
                </div>
            )}
        </div>
        {subValue && <span className="text-[10px] font-mono text-slate-400">{subValue}</span>}
    </div>
);

const findModelCost = (prices: AiModelPrice[], model: string): number =>
    prices.find(p => p.model === model)?.cost_per_request ?? 0;

const COST_TARGET_BREAKDOWN: { label: string; key: AiUserCostCategory; color: string }[] = [
    { label: 'Guest (Anonimi)', key: 'guest', color: 'bg-slate-400' },
    { label: 'Free (Account)', key: 'free', color: 'bg-indigo-400' },
    { label: 'Sponsor / Pro', key: 'sponsor', color: 'bg-emerald-400' },
    { label: 'Admin (Staff)', key: 'admin', color: 'bg-purple-400' },
];

const SEASON_BREAKDOWN: { label: string; key: AiSeasonKey; icon: LucideIcon; color: string }[] = [
    { label: 'Inverno', key: 'winter', icon: Snowflake, color: 'text-blue-400' },
    { label: 'Primavera', key: 'spring', icon: Leaf, color: 'text-emerald-400' },
    { label: 'Estate', key: 'summer', icon: Sun, color: 'text-amber-400' },
    { label: 'Autunno', key: 'autumn', icon: CloudRain, color: 'text-orange-400' },
];

export const AiEconomicsDashboard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<AiEconomicsDashboardData | null>(null);

    const [simTraffic, setSimTraffic] = useState(0);
    const [simFlashCost, setSimFlashCost] = useState(0);
    const [simProCost, setSimProCost] = useState(0);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const res = await aiAdmin.getEconomicsDashboardData();
            setData(res);
            setSimFlashCost(findModelCost(res.modelPrices, 'flash'));
            setSimProCost(findModelCost(res.modelPrices, 'pro'));
        } catch (e) {
            console.error('Error loading Economics data', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (isLoading || !data) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                <p className="text-slate-500 text-sm">Analisi bilancio economico AI...</p>
            </div>
        );
    }

    const currentCosts = data.costs.thirtyDays;
    const trafficMultiplier = 1 + (simTraffic / 100);
    const baseFlashCost = findModelCost(data.modelPrices, 'flash');
    const baseProCost = findModelCost(data.modelPrices, 'pro');
    const simulatorReady = baseFlashCost > 0 && baseProCost > 0;
    const estFlashCost = simulatorReady
        ? currentCosts.flash * (simFlashCost / baseFlashCost) * trafficMultiplier
        : 0;
    const estProCost = simulatorReady
        ? currentCosts.pro * (simProCost / baseProCost) * trafficMultiplier
        : 0;
    const estTotalCost = estFlashCost + estProCost;
    const estMargin = data.mrr - estTotalCost;
    const estMarginPercent = data.mrr > 0 ? (estMargin / data.mrr) * 100 : 0;

    const realMargin = data.mrr - data.costs.thirtyDays.total;
    const realMarginPercent = data.mrr > 0 ? (realMargin / data.mrr) * 100 : 0;

    const monthTrend = data.costs.lastMonth > 0
        ? ((data.costs.thisMonth - data.costs.lastMonth) / data.costs.lastMonth) * 100
        : 0;

    return (
        <div className="space-y-8 animate-in fade-in pb-20">
             <AdminPageHeader
                as="h1"
                icon={TrendingUp}
                title="AI Economics Dashboard"
                subtitle="Monitoraggio profittabilità, costi infrastruttura e proiezioni business"
                accent="emerald"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <SectionCard title="Ricavi Sponsor" icon={Euro} subtitle="Entrate mensili ricorrenti (MRR)">
                    <div className="space-y-4">
                        <KpiCard label="MRR Attuale" value={data.mrr} subValue="Abbonamenti status=active" />
                        <KpiCard label="Incasso ult. 30gg" value={data.mrr} subValue="Totale reale da subscriptions" />
                    </div>
                </SectionCard>

                <SectionCard title="Costi AI Reali" icon={Zap} subtitle="Basati su consumi effettivi ai_global_usage">
                    <div className="grid grid-cols-1 gap-3">
                        <KpiCard label="Costo Ultimi 30gg" value={data.costs.thirtyDays.total} trend={monthTrend} />
                        <div className="flex gap-2">
                            <div className="flex-1 p-3 bg-slate-950/30 rounded-xl border border-slate-800">
                                <p className="text-[10px] font-black text-slate-500 uppercase">Flash</p>
                                <p className="text-sm font-bold text-indigo-400">€{data.costs.thirtyDays.flash.toFixed(2)}</p>
                            </div>
                            <div className="flex-1 p-3 bg-slate-950/30 rounded-xl border border-slate-800">
                                <p className="text-[10px] font-black text-slate-500 uppercase">Pro</p>
                                <p className="text-sm font-bold text-rose-400">€{data.costs.thirtyDays.pro.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Margine Netto (Stima)" icon={BarChart3} subtitle="Revenue - Infrastruttura AI (30gg)">
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                             <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Saldo Margine</span>
                             <p className={`text-4xl font-black mt-1 ${realMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                 €{Math.abs(realMargin).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                             </p>
                             <div className="mt-2 flex items-center gap-2">
                                 <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${realMarginPercent > 30 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                     {realMarginPercent.toFixed(1)}% MARGINE
                                 </span>
                             </div>
                        </div>
                    </div>
                </SectionCard>

                 <SectionCard title="Performance Oggi" icon={ArrowUpRight} subtitle="Dati real-time ultima finestra 24h">
                    <div className="space-y-4">
                        <KpiCard label="Costo Oggi" value={data.costs.today.flash + data.costs.today.pro} subValue="Aggiornato in tempo reale" />
                        <div className="grid grid-cols-2 gap-2">
                             <div className="text-center p-2 bg-slate-950/30 rounded-xl border border-slate-800">
                                <p className="text-[8px] text-slate-500 font-black uppercase">Flash/Pro</p>
                                <p className="text-xs font-bold text-white">€{data.costs.today.flash.toFixed(2)} / €{data.costs.today.pro.toFixed(2)}</p>
                             </div>
                             <div className="text-center p-2 bg-slate-950/30 rounded-xl border border-slate-800">
                                <p className="text-[8px] text-slate-500 font-black uppercase">7 Giorni</p>
                                <p className="text-xs font-bold text-white">€{data.costs.sevenDays.total.toFixed(2)}</p>
                             </div>
                        </div>
                    </div>
                </SectionCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                <SectionCard title="Breakdown per Target" icon={Users} subtitle="Distribuzione costi AI (Ultimi 30 giorni)">
                    <div className="space-y-4 mt-2">
                        {COST_TARGET_BREAKDOWN.map(item => {
                            const val = data.costs.thirtyDays[item.key];
                            const percent = data.costs.thirtyDays.total > 0 ? (val / data.costs.thirtyDays.total) * 100 : 0;
                            return (
                                <div key={item.key} className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                                        <span className="text-slate-400">{item.label}</span>
                                        <span className="text-white">€{val.toFixed(2)} ({percent.toFixed(0)}%)</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: `${percent}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </SectionCard>

                <SectionCard title="Trend Stagionali" icon={Leaf} subtitle="Distribuzione costi cumulativa storica">
                    <div className="grid grid-cols-2 gap-4 h-full content-center">
                        {SEASON_BREAKDOWN.map(season => (
                            <div key={season.key} className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800 flex items-center gap-3">
                                <season.icon className={`w-5 h-5 ${season.color}`} />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-500">{season.label}</p>
                                    <p className="text-sm font-bold text-white">€{(data.trends.seasonal[season.key] || 0).toFixed(0)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {Object.values(data.trends.seasonal).every(v => v === 0) && (
                        <p className="text-[9px] text-center text-slate-600 italic mt-4">In attesa di dati storici stagionali...</p>
                    )}
                </SectionCard>

                <SectionCard title="Scenario Simulator" icon={Calculator} subtitle="Simulatore locale (nessuna scrittura sul DB)">
                    <div className="space-y-5">
                        {!simulatorReady && (
                            <p className="text-[10px] text-amber-400 flex items-center gap-1.5">
                                <ShieldAlert className="w-3 h-3 shrink-0" />
                                Costi base modelli non configurati — simulatore disabilitato
                            </p>
                        )}
                        <div className="space-y-1.5">
                            <div className="flex justify-between">
                                <label className="text-[10px] font-black uppercase text-slate-400">Variazione Traffico</label>
                                <span className={`text-[10px] font-bold ${simTraffic >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{simTraffic >= 0 ? '+' : ''}{simTraffic}%</span>
                            </div>
                            <input
                                type="range"
                                min="-90" max="500" step="10"
                                value={simTraffic}
                                onChange={(e) => setSimTraffic(parseInt(e.target.value, 10))}
                                disabled={!simulatorReady}
                                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400">Costo Flash (€)</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={simFlashCost}
                                    onChange={(e) => setSimFlashCost(parseFloat(e.target.value))}
                                    disabled={!simulatorReady}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white outline-none focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400">Costo Pro (€)</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={simProCost}
                                    onChange={(e) => setSimProCost(parseFloat(e.target.value))}
                                    disabled={!simulatorReady}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white outline-none focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-indigo-400">Nuovo Costo Stimato</span>
                                <span className="text-sm font-bold text-white">
                                    {simulatorReady
                                        ? `€${estTotalCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
                                        : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-indigo-400">Nuovo Margine Stima</span>
                                <span className={`text-sm font-black ${simulatorReady ? (estMargin >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-500'}`}>
                                    {simulatorReady
                                        ? `€${estMargin.toLocaleString('it-IT', { minimumFractionDigits: 2 })} (${estMarginPercent.toFixed(0)}%)`
                                        : '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </SectionCard>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[40px] flex gap-8 items-center">
                <div className="p-5 bg-amber-500/10 rounded-3xl border border-amber-500/20 hidden md:block">
                    <Info className="w-8 h-8 text-amber-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
                    <GuideItem icon={Euro} text="Modificando i costi unitari modelli, influisci istantaneamente sulla spesa calcolata per ogni singola richiesta AI." />
                    <GuideItem icon={Users} text="Il budget anonimi limita l'esposizione economica sui guest, mentre i limiti piani controllano l'infrastruttura inclusa negli abbonamenti." />
                    <GuideItem icon={ShieldAlert} text="L'Emergency Stop è l'ultima linea di difesa: blocca ogni chiamata AI se i costi dovessero superare i parametri di sicurezza." />
                </div>
            </div>

        </div>
    );
};

interface GuideItemProps {
    icon: LucideIcon;
    text: string;
}

const GuideItem = ({ icon: Icon, text }: GuideItemProps) => (
    <div className="flex gap-3">
        <div className="mt-1">
            <Icon className="w-4 h-4 text-slate-500" />
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400 italic">
            {text}
        </p>
    </div>
);
