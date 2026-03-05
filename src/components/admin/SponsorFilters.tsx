import React from 'react';
import { Filter, X, Award } from 'lucide-react';

interface SponsorFiltersProps {
    filters: {
        continent: string;
        nation: string;
        adminRegion: string;
        zone: string;
        city: string;
        tier?: string;
    };
    options: {
        continents: string[];
        nations: string[];
        adminRegions: string[];
        zones: string[];
        cities: { id: string; name: string }[];
    };
    handlers: {
        onContinentChange: (val: string) => void;
        onNationChange: (val: string) => void;
        onAdminRegionChange: (val: string) => void;
        onZoneChange: (val: string) => void;
        onCityChange: (val: string) => void;
        onTierChange?: (val: string) => void;
    };
}

const FilterWrapper = ({ children, onClear, isActive }: { children?: React.ReactNode, onClear: () => void, isActive: boolean }) => (
    <div className="relative group/filter flex items-center">
        {children}
        {isActive && (
            <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClear(); }} 
                className="absolute right-7 top-1/2 -translate-y-1/2 bg-slate-800 text-red-400 hover:text-white hover:bg-red-500 rounded-full p-0.5 shadow-md border border-slate-700 transition-all z-10"
                title="Resetta filtro"
            >
                <X className="w-2.5 h-2.5"/>
            </button>
        )}
    </div>
);

export const SponsorFilters = ({ filters, options, handlers }: SponsorFiltersProps) => {
    return (
        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-wrap gap-3 items-center shadow-lg">
            <div className="flex items-center gap-2 px-2 border-r border-slate-800 mr-2 text-slate-500">
                <Filter className="w-4 h-4"/>
                <span className="text-xs font-bold uppercase hidden sm:inline">Area</span>
            </div>

            <FilterWrapper isActive={!!filters.continent} onClear={() => handlers.onContinentChange('')}>
                <select 
                    value={filters.continent} 
                    onChange={e => handlers.onContinentChange(e.target.value)} 
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 min-w-[100px]"
                >
                    <option value="">Continente</option>
                    {options.continents.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </FilterWrapper>

            <FilterWrapper isActive={!!filters.nation} onClear={() => handlers.onNationChange('')}>
                <select 
                    value={filters.nation} 
                    onChange={e => handlers.onNationChange(e.target.value)} 
                    disabled={!filters.continent && options.nations.length > 1} 
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 min-w-[100px]"
                >
                    <option value="">Nazione</option>
                    {options.nations.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </FilterWrapper>

            <FilterWrapper isActive={!!filters.adminRegion} onClear={() => handlers.onAdminRegionChange('')}>
                <select 
                    value={filters.adminRegion} 
                    onChange={e => handlers.onAdminRegionChange(e.target.value)} 
                    disabled={!filters.nation} 
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 min-w-[100px]"
                >
                    <option value="">Regione</option>
                    {options.adminRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </FilterWrapper>

            <FilterWrapper isActive={!!filters.zone} onClear={() => handlers.onZoneChange('')}>
                <select 
                    value={filters.zone} 
                    onChange={e => handlers.onZoneChange(e.target.value)} 
                    disabled={!filters.adminRegion} 
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 min-w-[120px]"
                >
                    <option value="">Zona (Tutte)</option>
                    {options.zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
            </FilterWrapper>

            <FilterWrapper isActive={!!filters.city} onClear={() => handlers.onCityChange('')}>
                <select 
                    value={filters.city} 
                    onChange={e => handlers.onCityChange(e.target.value)} 
                    disabled={!filters.zone && !filters.adminRegion} 
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 min-w-[150px]"
                >
                    <option value="">Città (Tutte)</option>
                    {options.cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </FilterWrapper>

            {handlers.onTierChange && (
                <>
                    <div className="w-px h-6 bg-slate-800 mx-1"></div>

                    <div className="flex items-center gap-2 px-2 border-r border-slate-800 mr-2 text-slate-500">
                        <Award className="w-4 h-4"/>
                        <span className="text-xs font-bold uppercase hidden sm:inline">Livello</span>
                    </div>

                    <FilterWrapper isActive={!!filters.tier} onClear={() => handlers.onTierChange!('')}>
                        <select 
                            value={filters.tier} 
                            onChange={e => handlers.onTierChange!(e.target.value)} 
                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 min-w-[120px]"
                        >
                            <option value="">Tutti</option>
                            <option value="gold">Gold</option>
                            <option value="silver">Silver</option>
                            <option value="standard">Standard</option>
                        </select>
                    </FilterWrapper>
                </>
            )}
        </div>
    );
};