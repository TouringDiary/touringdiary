
import React from 'react';
import { Search, LayoutList, MapPin, Camera, TrendingUp, Star, Users, Filter } from 'lucide-react';
import { MainTab, CityAlgo } from '../../hooks/useRankingsLogic';

// ALGO CONFIG EXPORTATA PER RIUTILIZZO (es. Footer)
export const ALGO_CONFIG = {
    mix: {
        label: 'Mix Equilibrato',
        icon: TrendingUp,
        desc: 'Il nostro algoritmo "Best of both worlds". Combina la qualità percepita dall\'AI (60%) con il volume reale di visitatori (40%) per evidenziare le mete che uniscono popolarità e bellezza oggettiva.'
    },
    ai: {
        label: 'Qualità AI',
        icon: Star,
        desc: 'Classifica puramente qualitativa basata sull\'analisi semantica delle recensioni, la ricchezza storica e l\'unicità del patrimonio culturale, indipendentemente dalla folla.'
    },
    community: {
        label: 'Popolari',
        icon: Users,
        desc: 'Ranking basato sui numeri puri: volume di traffico, check-in degli utenti e interazioni social. Mostra dove va la maggior parte delle persone.'
    }
};

interface RankingFiltersProps {
    mainTab: MainTab;
    setMainTab: (t: MainTab) => void;
    cityAlgo: CityAlgo;
    setCityAlgo: (a: CityAlgo) => void;
    search: string;
    setSearch: (s: string) => void;
    selectedZone: string;
    setSelectedZone: (z: string) => void;
    availableZones: string[];
    onClose: () => void;
}

export const RankingFilters: React.FC<RankingFiltersProps> = ({
    mainTab, setMainTab, cityAlgo, setCityAlgo, search, setSearch,
    selectedZone, setSelectedZone, availableZones
}) => {
    return (
        <div className="space-y-0">
             {/* ROW 1: TABS & SEARCH */}
             <div className="flex flex-wrap gap-4 items-center justify-between md:justify-start">
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                     <button onClick={() => setMainTab('cities')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${mainTab === 'cities' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}><LayoutList className="w-4 h-4"/> <span className="hidden md:inline">Città</span></button>
                     <button onClick={() => setMainTab('pois')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${mainTab === 'pois' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}><MapPin className="w-4 h-4"/> <span className="hidden md:inline">Luoghi</span></button>
                     <button onClick={() => setMainTab('gallery')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${mainTab === 'gallery' ? 'bg-pink-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}><Camera className="w-4 h-4"/> <span className="hidden md:inline">Foto</span></button>
                </div>
                
                {/* ZONE FILTER DROPDOWN */}
                <div className="relative group shrink-0">
                    <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none"/>
                    <select 
                        value={selectedZone} 
                        onChange={(e) => setSelectedZone(e.target.value)} 
                        className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-white focus:border-indigo-500 outline-none appearance-none cursor-pointer hover:bg-slate-800 transition-colors font-bold uppercase tracking-wide min-w-[150px]"
                    >
                        <option value="">Tutte le Zone</option>
                        {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                </div>

                <div className="relative group flex-1 md:w-64 min-w-[200px]">
                     <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 group-focus-within:text-indigo-500 transition-colors"/>
                     <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca..." className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-indigo-500 outline-none placeholder:text-slate-600"/>
                </div>
            </div>

            {/* ROW 2: ALGO SELECTOR (Only for Cities) */}
            {mainTab === 'cities' && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-center w-full">
                    <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner overflow-x-auto max-w-full no-scrollbar">
                        {Object.entries(ALGO_CONFIG).map(([key, conf]) => (
                            <button 
                                key={key} 
                                onClick={() => setCityAlgo(key as CityAlgo)} 
                                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${cityAlgo === key ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                            >
                                <conf.icon className="w-4 h-4"/> {conf.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
