
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart2, Search, ArrowUpDown, ChevronUp, ChevronDown, Mail } from 'lucide-react';
import { SponsorRequest } from '../../types/index';
import { getFullManifestAsync } from '../../services/cityService';

interface DashboardProps {
    requests: SponsorRequest[];
    onNavigate: (cityId: string, statusTab: 'pending' | 'waiting' | 'approved' | 'rejected', filterUnread: boolean) => void;
}

export const SponsorDashboardOverview = ({ requests, onNavigate }: DashboardProps) => {
    const [cities, setCities] = useState<any[]>([]);
    const [sortKey, setSortKey] = useState<string>('pending');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [filterText, setFilterText] = useState('');
    const [sponsorFilter, setSponsorFilter] = useState<'all' | 'with' | 'without'>('all');

    useEffect(() => {
        getFullManifestAsync().then(manifest => {
            const stats = manifest.map(city => {
                const cityReqs = requests.filter(r => r.cityId === city.id);
                const countUnread = (list: SponsorRequest[]) => list.reduce((sum, r) => sum + (r.partnerLogs?.filter(l => l.isUnread).length || 0), 0);

                return {
                    id: city.id,
                    name: city.name,
                    zone: city.zone,
                    pending: cityReqs.filter(r => r.status === 'pending').length,
                    pendingUnread: countUnread(cityReqs.filter(r => r.status === 'pending')),
                    waiting: cityReqs.filter(r => r.status === 'waiting_payment').length,
                    waitingUnread: countUnread(cityReqs.filter(r => r.status === 'waiting_payment')),
                    active: cityReqs.filter(r => r.status === 'approved' && !r.isExpired).length,
                    activeUnread: countUnread(cityReqs.filter(r => r.status === 'approved' && !r.isExpired)),
                    rejected: cityReqs.filter(r => r.status === 'rejected').length,
                    rejectedUnread: countUnread(cityReqs.filter(r => r.status === 'rejected')),
                    cancelled: cityReqs.filter(r => r.status === 'cancelled').length,
                    cancelledUnread: countUnread(cityReqs.filter(r => r.status === 'cancelled')),
                    total: cityReqs.length
                };
            });
            setCities(stats);
        });
    }, [requests]);

    const sortedAndFilteredStats = useMemo(() => {
        let filtered = cities;
        
        // 1. Filtro testuale
        if (filterText) {
            const lowerFilter = filterText.toLowerCase();
            filtered = filtered.filter(c => c.name.toLowerCase().includes(lowerFilter));
        }

        // 2. Filtro Sponsor (Decisione UI)
        if (sponsorFilter === 'with') {
            filtered = filtered.filter(c => c.total > 0);
        } else if (sponsorFilter === 'without') {
            filtered = filtered.filter(c => c.total === 0);
        }

        return [...filtered].sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            if (typeof valA === 'string') return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            return sortDir === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
        });
    }, [cities, sortKey, sortDir, filterText, sponsorFilter]);

    const handleSort = (key: string) => {
        if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const StatusCell = ({ count, unread, status, cityId, colorText }: any) => (
        <div className={`w-full h-full flex items-center justify-center gap-1 py-1 px-2 rounded-lg transition-colors group/cell ${count > 0 ? 'hover:bg-white/5' : 'opacity-30'}`}>
            <button onClick={() => onNavigate(cityId, status, false)} className={`flex-1 flex items-center justify-center h-8 rounded hover:bg-white/10 text-lg font-bold ${count > 0 ? colorText : 'text-slate-600'}`}>{count}</button>
            <button onClick={() => onNavigate(cityId, status, true)} disabled={unread === 0} className={`relative w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 ${unread > 0 ? 'cursor-pointer' : 'opacity-0'}`}><Mail className={`w-4 h-4 ${unread > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}/>{unread > 0 && <span className="absolute top-0 right-0 bg-rose-600 text-white text-[9px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center border border-slate-900">{unread}</span>}</button>
        </div>
    );

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-6">
                    <h3 className="font-bold text-white flex items-center gap-2 whitespace-nowrap"><BarChart2 className="w-5 h-5 text-indigo-500"/> Partner per Città</h3>
                    
                    {/* Filtro Sponsor Toggle */}
                    <div className="flex bg-slate-900 border border-slate-700 p-1 rounded-xl">
                        {[
                            { id: 'all', label: 'Tutte' },
                            { id: 'with', label: 'Con Sponsor' },
                            { id: 'without', label: 'Senza' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setSponsorFilter(f.id as any)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${sponsorFilter === f.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative w-full md:w-64"><Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5"/><input type="text" placeholder="Filtra città..." value={filterText} onChange={e => setFilterText(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none"/></div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                    <thead>
                        <tr className="bg-slate-950/50 text-slate-500 text-[10px] uppercase font-bold">
                            <th className="p-4 border-b border-slate-800 cursor-pointer" onClick={() => handleSort('name')}>Città</th>
                            <th className="p-4 border-b border-slate-800 text-center w-28" onClick={() => handleSort('pending')}>Nuove</th>
                            <th className="p-4 border-b border-slate-800 text-center w-28" onClick={() => handleSort('waiting')}>Attesa Pag.</th>
                            <th className="p-4 border-b border-slate-800 text-center w-28" onClick={() => handleSort('active')}>Attivi</th>
                            <th className="p-4 border-b border-slate-800 text-center w-28" onClick={() => handleSort('rejected')}>Rifiutati</th>
                            <th className="p-4 border-b border-slate-800 text-center w-28" onClick={() => handleSort('cancelled')}>Annullati</th>
                            <th className="p-4 border-b border-slate-800 text-center" onClick={() => handleSort('total')}>Tot</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {sortedAndFilteredStats.map(stat => (
                            <tr key={stat.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-4"><div className="font-bold text-white text-sm">{stat.name}</div><div className="text-[10px] text-slate-500 uppercase">{stat.zone}</div></td>
                                <td className="p-2 text-center bg-slate-900/50"><StatusCell count={stat.pending} unread={stat.pendingUnread} status="pending" cityId={stat.id} colorText="text-amber-500" /></td>
                                <td className="p-2 text-center"><StatusCell count={stat.waiting} unread={stat.waitingUnread} status="waiting" cityId={stat.id} colorText="text-blue-500" /></td>
                                <td className="p-2 text-center bg-slate-900/50"><StatusCell count={stat.active} unread={stat.activeUnread} status="approved" cityId={stat.id} colorText="text-emerald-500" /></td>
                                <td className="p-2 text-center"><StatusCell count={stat.rejected} unread={stat.rejectedUnread} status="rejected" cityId={stat.id} colorText="text-slate-400" /></td>
                                <td className="p-2 text-center bg-slate-900/50"><StatusCell count={stat.cancelled} unread={stat.cancelledUnread} status="cancelled" cityId={stat.id} colorText="text-slate-500" /></td>
                                <td className={`p-4 text-center font-mono font-bold border-l border-slate-800 ${stat.total > 0 ? 'text-white' : 'text-slate-600'}`}>{stat.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
