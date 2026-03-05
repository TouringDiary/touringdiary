
import React, { useMemo } from 'react';
import { Globe, Map, Filter, ChevronDown, Flag, MapPin, Building2 } from 'lucide-react';
import { CitySummary } from '../../../types/index';

interface GeoSelection {
    continent: string;
    nation: string;
    region: string;
    zone: string;
    city: string;
}

interface GeoCascadingFiltersProps {
    cities: CitySummary[]; // Source of truth
    value: GeoSelection;
    onChange: (val: GeoSelection) => void;
    orientation?: 'horizontal' | 'vertical'; // NEW: Per adattarsi alla sidebar
}

const SelectBox = ({ 
    label, value, options, onChange, icon: Icon, disabled, fullWidth 
}: { 
    label: string, value: string, options: string[], onChange: (v: string) => void, icon: any, disabled: boolean, fullWidth?: boolean 
}) => (
    <div className={`relative group ${fullWidth ? 'w-full' : 'w-full md:w-auto flex-1'} ${disabled ? 'opacity-50' : ''}`}>
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">{label}</label>
        <div className="relative">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors"/>
            <select 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={`
                    w-full bg-slate-900 border rounded-xl py-3 pl-10 pr-8 text-xs font-bold uppercase tracking-wide appearance-none cursor-pointer outline-none transition-all
                    ${disabled ? 'border-slate-800 text-slate-600' : 'border-slate-700 text-white hover:border-indigo-500 focus:border-indigo-500 shadow-md'}
                `}
            >
                <option value="">{`Tutte (${options.length})`}</option>
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none"/>
        </div>
    </div>
);

export const GeoCascadingFilters = ({ cities, value, onChange, orientation = 'horizontal' }: GeoCascadingFiltersProps) => {
    
    // 1. Continents
    const continents = useMemo(() => Array.from(new Set(cities.map(c => c.continent || 'Europa'))).sort(), [cities]);

    // 2. Nations
    const nations = useMemo(() => {
        if (!value.continent) return [];
        return Array.from(new Set(cities.filter(c => (c.continent || 'Europa') === value.continent).map(c => c.nation || 'Italia'))).sort();
    }, [cities, value.continent]);

    // 3. Regions
    const regions = useMemo(() => {
        if (!value.nation) return [];
        return Array.from(new Set(cities.filter(c => (c.nation || 'Italia') === value.nation).map(c => c.adminRegion || 'Campania'))).sort();
    }, [cities, value.nation]);

    // 4. Zones (NEW)
    const zones = useMemo(() => {
        if (!value.region) return [];
        return Array.from(new Set(cities.filter(c => (c.adminRegion || 'Campania') === value.region).map(c => c.zone))).sort();
    }, [cities, value.region]);

    // 5. Cities (NEW)
    const filteredCities = useMemo(() => {
        let list = cities;
        if (value.region) list = list.filter(c => (c.adminRegion || 'Campania') === value.region);
        if (value.zone) list = list.filter(c => c.zone === value.zone);
        return list.map(c => c.name).sort();
    }, [cities, value.region, value.zone]);

    // Handlers
    const handleChange = (field: keyof GeoSelection, val: string) => {
        const resetLower = {
            continent: field === 'continent' ? val : value.continent,
            nation: field === 'continent' ? '' : (field === 'nation' ? val : value.nation),
            region: ['continent', 'nation'].includes(field) ? '' : (field === 'region' ? val : value.region),
            zone: ['continent', 'nation', 'region'].includes(field) ? '' : (field === 'zone' ? val : value.zone),
            city: ['continent', 'nation', 'region', 'zone'].includes(field) ? '' : (field === 'city' ? val : value.city),
        };
        onChange(resetLower);
    };

    const isVertical = orientation === 'vertical';
    const containerClass = isVertical ? 'flex flex-col gap-4 w-full' : 'flex flex-col md:flex-row gap-4 items-end bg-slate-900 p-4 rounded-2xl border border-indigo-500/20 shadow-xl';
    const arrowClass = isVertical ? 'hidden' : 'hidden md:block pb-4 text-slate-700';

    return (
        <div className={containerClass}>
            
            <SelectBox label="Continente" value={value.continent} options={continents} onChange={v => handleChange('continent', v)} icon={Globe} disabled={false} fullWidth={isVertical} />
            
            <div className={arrowClass}>→</div>

            <SelectBox label="Nazione" value={value.nation} options={nations} onChange={v => handleChange('nation', v)} icon={Flag} disabled={!value.continent} fullWidth={isVertical} />

             <div className={arrowClass}>→</div>

            <SelectBox label="Regione" value={value.region} options={regions} onChange={v => handleChange('region', v)} icon={Map} disabled={!value.nation} fullWidth={isVertical} />
            
            <div className={arrowClass}>→</div>

            <SelectBox label="Zona Turistica" value={value.zone} options={zones} onChange={v => handleChange('zone', v)} icon={MapPin} disabled={!value.region} fullWidth={isVertical} />

            <div className={arrowClass}>→</div>

            <SelectBox label="Città Specifica" value={value.city} options={filteredCities} onChange={v => handleChange('city', v)} icon={Building2} disabled={!value.region} fullWidth={isVertical} />
            
            {!isVertical && value.region && (
                 <div className="ml-auto flex items-center gap-2 pb-2 animate-in fade-in">
                     <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest bg-emerald-900/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm flex items-center gap-1">
                         <Filter className="w-3 h-3"/> Attivo
                     </span>
                 </div>
            )}
        </div>
    );
};
