
import React, { useMemo, useState, useEffect } from 'react';
import { Loader2, MapPin, UserCheck, PieChart, BarChart, LayoutDashboard } from 'lucide-react';
import { getAllSponsorsForDashboard } from '../../services/sponsorService';
import { getFullManifestAsync } from '../../services/cityService';
import { formatCurrency } from '../../utils/common';
import { SponsorRequest } from '../../types/index';

export const AdminStatsDashboard = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'matrix' | 'guides' | 'financial' | 'migration'>('overview');
    const [liveManifest, setLiveManifest] = useState<any[]>([]);
    const [sponsors, setSponsors] = useState<SponsorRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [manifestData, sponsorsData] = await Promise.all([
                    getFullManifestAsync(),
                    getAllSponsorsForDashboard() // Fetch REAL COMPLETE DATA from Cloud (recursive)
                ]);
                setLiveManifest(manifestData);
                setSponsors(sponsorsData);
            } catch (e) {
                console.error("Dashboard Load Error:", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const stats = useMemo(() => {
        const approved = sponsors.filter(s => s.status === 'approved' || s.status === 'expired');
        const pipeline = sponsors.filter(s => s.status === 'waiting_payment' || s.status === 'pending');
        const totalRevenue = approved.reduce((sum, s) => sum + (s.amount || 0), 0);
        const totalPipeline = pipeline.reduce((sum, s) => sum + (s.amount || 50), 0);

        const cityStats: Record<string, any> = {};
        liveManifest.forEach(c => {
            cityStats[c.id] = { id: c.id, name: c.name, zone: c.zone, revenue: 0, contracts: 0, guidesCount: 0, categories: { GUI: 0, FOO: 0, HOT: 0, SHO: 0, LEI: 0, NAT: 0, MON: 0, DIS: 0 } };
        });

        approved.forEach(s => {
            if (!s.cityId || !cityStats[s.cityId]) return;
            const cs = cityStats[s.cityId];
            cs.revenue += (s.amount || 0);
            cs.contracts += 1;
            if (s.type === 'guide') { cs.categories.GUI++; cs.guidesCount++; }
            else if (s.poiCategory === 'food') cs.categories.FOO++;
            else if (s.poiCategory === 'hotel') cs.categories.HOT++;
            else if (s.poiCategory === 'shop') cs.categories.SHO++;
            else if (s.poiCategory === 'leisure') cs.categories.LEI++;
            else if (s.poiCategory === 'nature') cs.categories.NAT++;
            else if (s.poiCategory === 'monument') cs.categories.MON++;
            else cs.categories.DIS++;
        });

        const activeCitiesCount = Object.values(cityStats).filter((c: any) => c.contracts > 0).length;
        const uncoveredCities = Object.values(cityStats).filter((c: any) => c.contracts === 0);
        const guideList = approved.filter(s => s.type === 'guide');

        const catRevenue: Record<string, number> = { SHOPPING: 0, NATURA: 0, SAPORI: 0, GUIDE: 0, ALLOGGI: 0, SVAGO: 0, MONUMENTI: 0, NOVITÀ: 0 };
        approved.forEach(s => {
            let label = 'NOVITÀ';
            if (s.type === 'guide') label = 'GUIDE';
            else if (s.poiCategory === 'shop') label = 'SHOPPING';
            else if (s.poiCategory === 'nature') label = 'NATURA';
            else if (s.poiCategory === 'food') label = 'SAPORI';
            else if (s.poiCategory === 'hotel') label = 'ALLOGGI';
            else if (s.poiCategory === 'leisure') label = 'SVAGO';
            else if (s.poiCategory === 'monument') label = 'MONUMENTI';
            catRevenue[label] += (s.amount || 0);
        });

        // NEW: Zone Revenue
        const zoneRevenue: Record<string, number> = {};
        approved.forEach(s => {
            const city = liveManifest.find(c => c.id === s.cityId);
            if (city && city.zone) {
                if (!zoneRevenue[city.zone]) zoneRevenue[city.zone] = 0;
                zoneRevenue[city.zone] += (s.amount || 0);
            }
        });

        // Rejected count from FULL dataset (not limited)
        const rejectedCount = sponsors.filter(s => s.status === 'rejected').length;

        return {
            totalRevenue, totalPipeline, totalContracts: approved.length,
            activeCitiesCount, totalCities: liveManifest.length,
            uncoveredCities, catRevenue, zoneRevenue, guideList,
            rejectedCount, // Added for verification
            matrix: Object.values(cityStats).sort((a: any, b: any) => b.revenue - a.revenue)
        };
    }, [liveManifest, sponsors]);

    if (loading) return <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500"><Loader2 className="w-12 h-12 animate-spin text-indigo-500"/><p className="font-bold uppercase tracking-widest text-[11px]">Caricamento Dati Cloud...</p></div>;

    const totalGuides = stats.guideList.length;
    const citiesWithoutGuides = liveManifest.length - stats.matrix.filter((c:any) => c.guidesCount > 0).length;

    return (
        <div className="flex flex-col h-full space-y-6">
            
            {/* HEADER STILE MARKETING */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                        <LayoutDashboard className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white font-display">Dashboard</h2>
                        <p className="text-slate-400 text-sm">Panoramica finanziaria e territoriale</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center bg-slate-900 p-1.5 rounded-xl border border-slate-800 shrink-0">
                <div className="flex gap-1">
                    <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Overview</button>
                    <button onClick={() => setActiveTab('matrix')} className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Matrice Territoriale</button>
                    <button onClick={() => setActiveTab('guides')} className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'guides' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Focus Guide</button>
                    <button onClick={() => setActiveTab('financial')} className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'financial' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Financial</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-16">
                {/* TAB: FOCUS GUIDE (RESTORED) */}
                {activeTab === 'guides' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-900/50 border border-indigo-500/30 p-6 rounded-3xl shadow-lg flex items-center gap-5">
                                <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-900/40"><UserCheck className="w-8 h-8 text-white"/></div>
                                <div><h3 className="text-4xl font-display font-black text-white">{totalGuides}</h3><p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Guide Totali Certificate</p></div>
                            </div>
                             <div className="bg-slate-900/50 border border-red-500/30 p-6 rounded-3xl shadow-lg flex items-center gap-5">
                                <div className="p-4 bg-red-900/20 rounded-2xl border border-red-500/20"><MapPin className="w-8 h-8 text-red-500"/></div>
                                <div><h3 className="text-4xl font-display font-black text-white">{citiesWithoutGuides}</h3><p className="text-xs font-bold text-red-400 uppercase tracking-widest">Città Senza Guide</p></div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 text-[10px] font-black uppercase tracking-widest mb-2">
                             <span className="text-emerald-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> OTTIMA (3+)</span>
                             <span className="text-amber-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> MINIMA (1-2)</span>
                             <span className="text-red-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> ASSENTE (0)</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {stats.matrix.map((c: any) => {
                                const count = c.guidesCount;
                                const statusColor = count >= 3 ? 'text-emerald-500' : count > 0 ? 'text-amber-500' : 'text-red-500';
                                const dotColor = count >= 3 ? 'bg-emerald-500' : count > 0 ? 'bg-amber-500' : 'bg-red-500';
                                
                                return (
                                    <div key={c.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm hover:border-slate-600 transition-colors">
                                        <div>
                                            <div className="font-bold text-white text-sm">{c.name}</div>
                                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{c.zone}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xl font-black ${statusColor}`}>{count}</span>
                                            <div className={`w-2 h-2 rounded-full ${dotColor} shadow-[0_0_8px_rgba(255,255,255,0.2)]`}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB: FINANCIAL (RESTORED) */}
                {activeTab === 'financial' && (
                     <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             {/* Revenue per Category */}
                             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                                 <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3"><PieChart className="w-6 h-6 text-emerald-500"/> Ricavi per Categoria</h3>
                                 <div className="space-y-5">
                                     {Object.entries(stats.catRevenue).sort((a:any, b:any) => b[1] - a[1]).map(([cat, val]: [string, any]) => (
                                         <div key={cat}>
                                             <div className="flex justify-between items-end mb-1">
                                                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cat}</span>
                                                 <div className="text-sm font-mono font-bold text-white">
                                                     {formatCurrency(val)} <span className="text-slate-600 text-[10px]">({Math.round((val / stats.totalRevenue) * 100) || 0}%)</span>
                                                 </div>
                                             </div>
                                             <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                 <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(val / stats.totalRevenue) * 100}%` }}></div>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>

                             {/* Revenue per Zone */}
                             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                                 <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3"><BarChart className="w-6 h-6 text-blue-500"/> Ricavi per Zona</h3>
                                 <div className="space-y-3">
                                     {Object.entries(stats.zoneRevenue).sort((a:any, b:any) => b[1] - a[1]).map(([zone, val]: [string, any]) => (
                                         <div key={zone} className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                                             <span className="text-xs font-bold text-slate-300 uppercase">{zone}</span>
                                             <span className="text-sm font-mono font-bold text-blue-400">{formatCurrency(val)}</span>
                                         </div>
                                     ))}
                                      {Object.keys(stats.zoneRevenue).length === 0 && <div className="text-center text-slate-500 italic py-10">Nessun dato di zona disponibile.</div>}
                                 </div>
                             </div>
                        </div>
                    </div>
                )}

                {/* TAB: OVERVIEW (EXISTING) */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-slate-900 border border-emerald-500/30 p-8 rounded-3xl shadow-xl relative group">
                                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">Fatturato Attivo</p>
                                <h3 className="text-4xl font-display font-bold text-white leading-none">{formatCurrency(stats.totalRevenue)}</h3>
                            </div>
                            <div className="bg-slate-900 border border-amber-500/30 p-8 rounded-3xl shadow-xl relative group">
                                <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-1">Pipeline (In Attesa)</p>
                                <h3 className="text-4xl font-display font-bold text-white leading-none">{formatCurrency(stats.totalPipeline)}</h3>
                            </div>
                            <div className="bg-slate-900 border border-blue-500/30 p-8 rounded-3xl shadow-xl relative group">
                                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Contratti Totali</p>
                                <h3 className="text-4xl font-display font-bold text-white leading-none">{stats.totalContracts}</h3>
                            </div>
                            <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-xl relative group">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Rifiutati Totali</p>
                                <h3 className="text-4xl font-display font-bold text-white leading-none">{stats.rejectedCount}</h3>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* TAB: MATRIX (EXISTING) */}
                {activeTab === 'matrix' && (
                     <div className="space-y-6 animate-in fade-in">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white flex items-center gap-3"><MapPin className="w-6 h-6 text-indigo-500"/> Matrice Territoriale</h3>
                                <div className="text-xs text-slate-400 uppercase font-bold tracking-widest">Totale Città: {stats.totalCities}</div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[1000px]">
                                    <thead>
                                        <tr className="bg-slate-950/50 text-slate-500 text-[10px] uppercase font-black tracking-wider border-b border-slate-800">
                                            <th className="p-4 w-64">Città / Zona</th>
                                            <th className="p-4 text-center">Fatturato</th>
                                            <th className="p-4 text-center">Contratti</th>
                                            <th className="p-4 text-center text-indigo-400">Guide</th>
                                            <th className="p-4 text-center text-amber-500">Cibo</th>
                                            <th className="p-4 text-center text-blue-500">Hotel</th>
                                            <th className="p-4 text-center text-purple-500">Shop</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {stats.matrix.map((c: any) => (
                                            <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-white text-sm">{c.name}</div>
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-wide">{c.zone}</div>
                                                </td>
                                                <td className="p-4 text-center font-mono font-bold text-emerald-400">{c.revenue > 0 ? formatCurrency(c.revenue) : '-'}</td>
                                                <td className="p-4 text-center font-bold text-white">{c.contracts > 0 ? c.contracts : <span className="text-slate-600">-</span>}</td>
                                                <td className="p-4 text-center text-slate-300">{c.categories.GUI || '-'}</td>
                                                <td className="p-4 text-center text-slate-300">{c.categories.FOO || '-'}</td>
                                                <td className="p-4 text-center text-slate-300">{c.categories.HOT || '-'}</td>
                                                <td className="p-4 text-center text-slate-300">{c.categories.SHO || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                     </div>
                )}
            </div>
        </div>
    );
};
