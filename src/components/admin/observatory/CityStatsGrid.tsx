
import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ChevronUp, ChevronDown, Download, Search, TrendingUp, Activity, Star, Image, FileText, Filter } from 'lucide-react';
import { CityQualityStats } from '../../../types/index';
import { formatVisitors } from '../../../utils/common';

interface Props {
    data: CityQualityStats[];
    geoFilter: { continent: string, nation: string, region: string, zone: string, city: string };
    cityStatusFilter: string;
    minQualityFilter: number;
    activeFiltersCount: number;
    onOpenFilter: () => void;
}

type SortKey = keyof CityQualityStats;

export const CityStatsGrid = ({ 
    data, 
    geoFilter, cityStatusFilter, minQualityFilter,
    activeFiltersCount, onOpenFilter 
}: Props) => {
    
    const [sortKey, setSortKey] = useState<SortKey>('city_name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [searchTerm, setSearchTerm] = useState('');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const sortedData = useMemo(() => {
        // 1. Filtro Testo Libero
        let filtered = data;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = data.filter(d => d.city_name.toLowerCase().includes(lower) || d.zone_name.toLowerCase().includes(lower));
        }
        
        // 2. Filtro Geografico
        if (geoFilter.continent) filtered = filtered.filter(d => d.continent === geoFilter.continent);
        if (geoFilter.nation) filtered = filtered.filter(d => d.nation === geoFilter.nation);
        if (geoFilter.region) filtered = filtered.filter(d => d.admin_region === geoFilter.region);
        if (geoFilter.zone) filtered = filtered.filter(d => d.zone_name === geoFilter.zone);
        if (geoFilter.city) filtered = filtered.filter(d => d.city_id === geoFilter.city);

        // 3. Filtro Status
        if (cityStatusFilter !== 'all') {
            // Mappatura stato visuale (Overview usa city_status diretto)
            if (cityStatusFilter === 'published') filtered = filtered.filter(d => d.city_status === 'published');
            else if (cityStatusFilter === 'draft') filtered = filtered.filter(d => d.city_status === 'draft' || d.city_status === 'needs_check');
            else if (cityStatusFilter === 'missing') filtered = filtered.filter(d => d.city_status === 'missing' || (!d.city_status));
        }

        // 4. Filtro Qualità
        if (minQualityFilter > 0) {
            filtered = filtered.filter(d => d.quality_score >= minQualityFilter);
        }

        // 5. Ordinamento
        return [...filtered].sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];

            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortDir === 'asc' ? valA - valB : valB - valA;
            }
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        });
    }, [data, sortKey, sortDir, searchTerm, geoFilter, cityStatusFilter, minQualityFilter]);

    // CSV FORMATTER
    const formatCsvValue = (val: any) => {
        if (typeof val === 'number') return `"${val.toString().replace('.', ',')}"`;
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
    };

    const handleExportCSV = () => {
        if (sortedData.length === 0) return;
        
        const headers = [
            "Continente", "Nazione", "Regione", "Zona Turistica", "Città",
            "Stato", "Visitatori Est.", "Qualità Dati %", 
            "Totale POI", "Copertura Foto %", "Copertura Testi %", "Rating Medio POI",
            "POI Top", "POI Medium", "POI Low",
            "Guide Turistiche", "Tour Operator",
            "Servizi Aeroporto", "Servizi Metro/Treni", "Bus & Tram", "Taxi & Car", "Trasporto Marittimo", "Altro",
            "Numeri Emergenza", "Farmacie",
            "Eventi", "Personaggi Famosi",
            "Sponsor Silver", "Sponsor Gold",
            "Shop Gusto", "Shop Cantina", "Shop Artigianato", "Shop Moda"
        ];

        const rows = sortedData.map(d => [
            formatCsvValue(d.continent),
            formatCsvValue(d.nation),
            formatCsvValue(d.admin_region),
            formatCsvValue(d.zone_name),
            formatCsvValue(d.city_name),
            formatCsvValue(d.city_status),
            formatCsvValue(d.visitors),
            formatCsvValue(d.quality_score),
            formatCsvValue(d.total_pois),
            formatCsvValue(d.photo_coverage),
            formatCsvValue(d.text_coverage),
            formatCsvValue(d.avg_rating),
            formatCsvValue(d.poi_top),
            formatCsvValue(d.poi_medium),
            formatCsvValue(d.poi_low),
            formatCsvValue(d.guides_count),
            formatCsvValue(d.tour_ops_count),
            formatCsvValue(d.svc_airport),
            formatCsvValue(d.svc_train),
            formatCsvValue(d.svc_bus),
            formatCsvValue(d.svc_taxi),
            formatCsvValue(d.svc_maritime),
            formatCsvValue(d.svc_other),
            formatCsvValue(d.svc_emergency),
            formatCsvValue(d.svc_pharmacy),
            formatCsvValue(d.events_count),
            formatCsvValue(d.people_count),
            formatCsvValue(d.sponsor_silver),
            formatCsvValue(d.sponsor_gold),
            formatCsvValue(d.shop_gusto),
            formatCsvValue(d.shop_cantina),
            formatCsvValue(d.shop_artigianato),
            formatCsvValue(d.shop_moda)
        ]);

        const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `observatory_report_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const SortIcon = ({ col }: { col: SortKey }) => {
        if (sortKey !== col) return <ArrowUpDown className="w-2.5 h-2.5 text-slate-600 opacity-20"/>;
        return sortDir === 'asc' ? <ChevronUp className="w-2.5 h-2.5 text-amber-500"/> : <ChevronDown className="w-2.5 h-2.5 text-amber-500"/>;
    };

    const Th = ({ label, k, w }: { label: string, k: SortKey, w?: string }) => (
        <th 
            className={`px-3 py-3 cursor-pointer hover:bg-slate-900 hover:text-white transition-colors group border-r border-slate-800/50 whitespace-nowrap ${w || 'w-auto'}`} 
            onClick={() => handleSort(k)}
        >
            <div className="flex items-center gap-1">{label} <SortIcon col={k}/></div>
        </th>
    );
    
    const StatusBadge = ({ status }: { status: string }) => {
        if (status === 'published') return <span className="bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[9px] font-black uppercase">Online</span>;
        if (status === 'draft') return <span className="bg-amber-900/30 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[9px] font-black uppercase">Bozza</span>;
        if (status === 'restored') return <span className="bg-purple-900/30 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[9px] font-black uppercase">Restored</span>;
        return <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded text-[9px] font-black uppercase">Missing</span>;
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden mt-0">
            
            {/* TOOLBAR */}
            <div className="p-3 border-b border-slate-800 bg-slate-950/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
                <div className="relative group w-full md:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 group-focus-within:text-indigo-500 transition-colors"/>
                    <input 
                        type="text" 
                        placeholder="Filtra per città..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none placeholder:text-slate-600"
                    />
                </div>
                
                <div className="flex items-center gap-3">
                     <button 
                        onClick={onOpenFilter}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider ${activeFiltersCount > 0 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'}`}
                    >
                        <Filter className="w-3.5 h-3.5"/> 
                        Filtri {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                    </button>

                    <div className="h-6 w-px bg-slate-800 mx-1"></div>

                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{sortedData.length} Città</span>
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shadow-lg active:scale-95"
                    >
                        <Download className="w-3.5 h-3.5"/> CSV
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[3500px]">
                    <thead className="bg-[#0f172a] sticky top-0 z-10 shadow-sm border-b border-slate-800">
                        <tr className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                            {/* GEO */}
                            <Th label="Continente" k="continent" w="w-32"/>
                            <Th label="Nazione" k="nation" w="w-24"/>
                            <Th label="Regione" k="admin_region" w="w-32"/>
                            <Th label="Zona Turistica" k="zone_name" w="w-40"/>
                            <Th label="Città" k="city_name" w="w-48"/>
                            
                            {/* STATUS & VISITORS */}
                            <Th label="Stato" k="city_status" w="w-24"/> 
                            <Th label="Visitatori Est." k="visitors" w="w-32"/>
                            
                            {/* QUALITY METRICS */}
                            <Th label="Qualità Dati %" k="quality_score" w="w-36"/>
                            <Th label="Totale POI" k="total_pois" w="w-24"/>
                            <Th label="Copertura Foto %" k="photo_coverage" w="w-32"/>
                            <Th label="Copertura Testi %" k="text_coverage" w="w-32"/>
                            <Th label="Rating Medio" k="avg_rating" w="w-28"/>

                            {/* POI BREAKDOWN */}
                            <Th label="POI Top" k="poi_top"/>
                            <Th label="POI Medium" k="poi_medium"/>
                            <Th label="POI Low" k="poi_low"/>
                            
                            {/* ENTITIES */}
                            <Th label="Guide Turistiche" k="guides_count"/>
                            <Th label="Tour Operator" k="tour_ops_count"/>
                            
                            {/* SERVICES */}
                            <Th label="Servizi Aeroporto" k="svc_airport"/>
                            <Th label="Servizi Metro/Treni" k="svc_train"/>
                            <Th label="Bus & Tram" k="svc_bus"/>
                            <Th label="Taxi & Car" k="svc_taxi"/>
                            <Th label="Trasporto Marittimo" k="svc_maritime"/>
                            <Th label="Altro" k="svc_other"/>
                            <Th label="Numeri Emergenza" k="svc_emergency"/>
                            <Th label="Farmacie" k="svc_pharmacy"/>
                            
                            {/* CONTENT */}
                            <Th label="Eventi" k="events_count"/>
                            <Th label="Personaggi Famosi" k="people_count"/>
                            
                            {/* SPONSOR */}
                            <Th label="Sponsor Silver" k="sponsor_silver"/>
                            <Th label="Sponsor Gold" k="sponsor_gold"/>
                            
                            {/* SHOP */}
                            <Th label="Shop Gusto" k="shop_gusto"/>
                            <Th label="Shop Cantina" k="shop_cantina"/>
                            <Th label="Shop Artigianato" k="shop_artigianato"/>
                            <Th label="Shop Moda" k="shop_moda"/>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-[10px] text-slate-300 font-mono">
                        {sortedData.map((row) => (
                            <tr key={row.city_id} className="hover:bg-slate-800/30 transition-colors group">
                                {/* GEO */}
                                <td className="px-3 py-2 border-r border-slate-800/30">{row.continent}</td>
                                <td className="px-3 py-2 border-r border-slate-800/30">{row.nation}</td>
                                <td className="px-3 py-2 border-r border-slate-800/30">{row.admin_region}</td>
                                <td className="px-3 py-2 border-r border-slate-800/30 truncate max-w-[150px]">{row.zone_name}</td>
                                <td className="px-3 py-2 font-bold text-white border-r border-slate-800/30">{row.city_name}</td>
                                
                                {/* STATUS */}
                                <td className="px-3 py-2 border-r border-slate-800/30 text-center">
                                    <StatusBadge status={row.city_status}/> 
                                </td>

                                {/* VISITATORI */}
                                <td className="px-3 py-2 border-r border-slate-800/30">
                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp className="w-3 h-3 text-indigo-400"/>
                                        <span className="font-bold text-white">{formatVisitors(row.visitors)}</span>
                                    </div>
                                </td>

                                {/* QUALITY SCORE */}
                                <td className="px-3 py-2 border-r border-slate-800/30">
                                    <div className="flex flex-col gap-1 w-24">
                                        <div className="flex justify-between items-end">
                                            <span className="font-bold text-white">{row.quality_score}%</span>
                                            <Activity className="w-2.5 h-2.5 text-slate-500"/>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${row.quality_score > 80 ? 'bg-emerald-500' : row.quality_score > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                style={{ width: `${row.quality_score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>

                                {/* TOTAL POI */}
                                <td className="px-3 py-2 text-center border-r border-slate-800/30 font-bold text-white">{row.total_pois}</td>

                                {/* PHOTO COVERAGE */}
                                <td className="px-3 py-2 border-r border-slate-800/30">
                                     <div className="flex flex-col gap-1 w-20">
                                        <div className="flex justify-between items-end">
                                            <span className="font-bold text-slate-300">{row.photo_coverage}%</span>
                                            <Image className="w-2.5 h-2.5 text-slate-500"/>
                                        </div>
                                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500" style={{ width: `${row.photo_coverage}%` }}></div>
                                        </div>
                                    </div>
                                </td>

                                {/* TEXT COVERAGE */}
                                <td className="px-3 py-2 border-r border-slate-800/30">
                                     <div className="flex flex-col gap-1 w-20">
                                        <div className="flex justify-between items-end">
                                            <span className="font-bold text-slate-300">{row.text_coverage}%</span>
                                            <FileText className="w-2.5 h-2.5 text-slate-500"/>
                                        </div>
                                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${row.text_coverage}%` }}></div>
                                        </div>
                                    </div>
                                </td>
                                
                                {/* AVG RATING */}
                                <td className="px-3 py-2 text-center border-r border-slate-800/30">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="font-bold text-amber-400">{row.avg_rating}</span>
                                        <Star className="w-2.5 h-2.5 text-amber-500 fill-current"/>
                                    </div>
                                </td>
                                
                                {/* POI LEVELS */}
                                <td className="px-3 py-2 text-center border-r border-slate-800/30 text-emerald-400 font-bold">{row.poi_top}</td>
                                <td className="px-3 py-2 text-center border-r border-slate-800/30 text-amber-400">{row.poi_medium}</td>
                                <td className="px-3 py-2 text-center border-r border-slate-800/30 text-slate-500">{row.poi_low}</td>
                                
                                {/* ENTITIES */}
                                <td className="px-3 py-2 text-center border-r border-slate-800/30">{row.guides_count}</td>
                                <td className="px-3 py-2 text-center border-r border-slate-800/30">{row.tour_ops_count}</td>
                                
                                {/* SERVICES */}
                                <td className="px-3 py-2 text-center border-r border-slate-800/30">{row.svc_airport}</td>
                                <td className="px-3 py-2 text-center border-r border-slate-800/30">{row.svc_train}</td>
                                <td className="px-3 py-2 text-center border-r border-slate-800/30">{row.svc_bus}</td>
                                <td className="px-3 py-2 text-center border-r border-slate-800/30">{row.svc_taxi}</td>
                                <td className="px-3 py-2 text-center border-r border-slate-800/30">{row.svc_maritime}</td>
                                <td className="px-3 py-2 text-center border-r border-slate-800/30">{row.svc_other}</td>
                                <td className="px-3 py-2 text-center border-r border-slate-800/30 text-rose-400 font-bold">{row.svc_emergency}</td>
                                <td className="px-3 py-2 text-center border-r border-slate-800/30 text-emerald-400 font-bold">{row.svc_pharmacy}</td>
                                
                                {/* CONTENT */}
                                <td className="px-3 py-2 text-center border-r border-slate-800/30">{row.events_count}</td>
                                <td className="px-3 py-2 text-center border-r border-slate-800/30">{row.people_count}</td>
                                
                                {/* SPONSOR */}
                                <td className="px-3 py-2 text-center border-r border-slate-800/30 text-slate-400 font-bold">{row.sponsor_silver}</td>
                                <td className="px-3 py-2 text-center border-r border-slate-800/30 text-amber-500 font-bold">{row.sponsor_gold}</td>
                                
                                {/* SHOP */}
                                <td className="px-3 py-2 text-center border-r border-slate-800/30">{row.shop_gusto}</td>
                                <td className="px-3 py-2 text-center border-r border-slate-800/30">{row.shop_cantina}</td>
                                <td className="px-3 py-2 text-center border-r border-slate-800/30">{row.shop_artigianato}</td>
                                <td className="px-3 py-2 text-center text-pink-400 font-bold">{row.shop_moda}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
