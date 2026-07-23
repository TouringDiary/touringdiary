
import React, { useMemo } from 'react';
import { Globe, Map, Filter, ChevronDown, Flag, MapPin, Building2, X } from 'lucide-react';
import { CitySummary } from '../../../types/index';

export interface GeoSelection {
    continent: string;
    nation: string;
    region: string;
    zone: string;
    city: string;
}

interface GeoCascadingFiltersProps {
    /** Source of truth: CitySummary labels (continent / nation / adminRegion / zone / name). */
    cities: CitySummary[];
    value: GeoSelection;
    onChange: (val: GeoSelection) => void;
    orientation?: 'horizontal' | 'vertical';
    /** Optional compact chrome for denser admin toolbars. */
    density?: 'comfortable' | 'compact';
}

const EMPTY_SELECTION: GeoSelection = {
    continent: '',
    nation: '',
    region: '',
    zone: '',
    city: '',
};

const SelectBox = ({
    label,
    value,
    options,
    onChange,
    icon: Icon,
    disabled,
    compact,
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
    icon: React.ComponentType<{ className?: string }>;
    disabled: boolean;
    compact?: boolean;
}) => (
    <div className={`relative group min-w-0 ${disabled ? 'opacity-45 pointer-events-none' : ''}`}>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.14em] block mb-1.5">
            {label}
        </label>
        <div className="relative">
            <Icon
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                    value ? 'text-indigo-400' : 'text-slate-500 group-focus-within:text-indigo-400'
                }`}
            />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                aria-label={label}
                className={`
                    w-full bg-slate-950/80 border rounded-xl text-xs font-semibold tracking-wide
                    appearance-none cursor-pointer outline-none transition-all
                    pl-10 pr-9
                    ${compact ? 'py-2.5' : 'py-3'}
                    ${
                        value
                            ? 'border-indigo-500/50 text-white shadow-[0_0_0_1px_rgba(99,102,241,0.15)]'
                            : 'border-slate-700/80 text-slate-300 hover:border-slate-500'
                    }
                    focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
                    disabled:cursor-not-allowed
                `}
            >
                <option value="">{options.length ? `Tutte (${options.length})` : '—'}</option>
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        </div>
    </div>
);

/**
 * Cascading geo filters — SoT = CitySummary display labels (never raw itinerary main_city / slug).
 * Used across Admin cities, observatory, and Itinerari & Recensioni.
 */
export const GeoCascadingFilters = ({
    cities,
    value,
    onChange,
    orientation = 'horizontal',
    density = 'comfortable',
}: GeoCascadingFiltersProps) => {
    const compact = density === 'compact';

    const continents = useMemo(
        () =>
            Array.from(new Set(cities.map((c) => c.continent).filter(Boolean) as string[])).sort(),
        [cities]
    );

    const nations = useMemo(() => {
        if (!value.continent) return [];
        return Array.from(
            new Set(
                cities
                    .filter((c) => c.continent === value.continent)
                    .map((c) => c.nation)
                    .filter(Boolean) as string[]
            )
        ).sort();
    }, [cities, value.continent]);

    const regions = useMemo(() => {
        if (!value.nation) return [];
        return Array.from(
            new Set(
                cities
                    .filter((c) => c.continent === value.continent && c.nation === value.nation)
                    .map((c) => c.adminRegion)
                    .filter(Boolean) as string[]
            )
        ).sort();
    }, [cities, value.continent, value.nation]);

    const zones = useMemo(() => {
        if (!value.region) return [];
        return Array.from(
            new Set(
                cities
                    .filter(
                        (c) =>
                            c.continent === value.continent &&
                            c.nation === value.nation &&
                            c.adminRegion === value.region
                    )
                    .map((c) => c.zone)
                    .filter((z): z is string => Boolean(z && z.trim()))
            )
        ).sort();
    }, [cities, value.continent, value.nation, value.region]);

    const cityNames = useMemo(() => {
        if (!value.region) return [];
        let list = cities.filter(
            (c) =>
                c.continent === value.continent &&
                c.nation === value.nation &&
                c.adminRegion === value.region
        );
        if (value.zone) list = list.filter((c) => c.zone === value.zone);
        return Array.from(new Set(list.map((c) => c.name).filter(Boolean))).sort();
    }, [cities, value.continent, value.nation, value.region, value.zone]);

    const handleChange = (field: keyof GeoSelection, val: string) => {
        const next: GeoSelection = {
            continent: field === 'continent' ? val : value.continent,
            nation: field === 'continent' ? '' : field === 'nation' ? val : value.nation,
            region: ['continent', 'nation'].includes(field)
                ? ''
                : field === 'region'
                  ? val
                  : value.region,
            zone: ['continent', 'nation', 'region'].includes(field)
                ? ''
                : field === 'zone'
                  ? val
                  : value.zone,
            city: ['continent', 'nation', 'region', 'zone'].includes(field)
                ? ''
                : field === 'city'
                  ? val
                  : value.city,
        };
        onChange(next);
    };

    const hasActive = Boolean(
        value.continent || value.nation || value.region || value.zone || value.city
    );

    const isVertical = orientation === 'vertical';
    const gridClass = isVertical
        ? 'grid grid-cols-1 gap-3 w-full'
        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 w-full';

    return (
        <div
            className={
                isVertical
                    ? 'flex flex-col gap-3 w-full'
                    : 'w-full rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-xl'
            }
        >
            {!isVertical && (
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-300">
                            <Filter className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-white tracking-wide">Area geografica</p>
                            <p className="text-[11px] text-slate-500 truncate">
                                Cascata Continente → Città · etichette da catalogo città
                            </p>
                        </div>
                    </div>
                    {hasActive ? (
                        <button
                            type="button"
                            onClick={() => onChange({ ...EMPTY_SELECTION })}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:border-rose-500/40 hover:text-rose-300 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            Azzera
                        </button>
                    ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                            Nessun filtro
                        </span>
                    )}
                </div>
            )}

            <div className={gridClass}>
                <SelectBox
                    label="Continente"
                    value={value.continent}
                    options={continents}
                    onChange={(v) => handleChange('continent', v)}
                    icon={Globe}
                    disabled={false}
                    compact={compact}
                />
                <SelectBox
                    label="Nazione"
                    value={value.nation}
                    options={nations}
                    onChange={(v) => handleChange('nation', v)}
                    icon={Flag}
                    disabled={!value.continent}
                    compact={compact}
                />
                <SelectBox
                    label="Regione"
                    value={value.region}
                    options={regions}
                    onChange={(v) => handleChange('region', v)}
                    icon={Map}
                    disabled={!value.nation}
                    compact={compact}
                />
                <SelectBox
                    label="Zona turistica"
                    value={value.zone}
                    options={zones}
                    onChange={(v) => handleChange('zone', v)}
                    icon={MapPin}
                    disabled={!value.region}
                    compact={compact}
                />
                <SelectBox
                    label="Città"
                    value={value.city}
                    options={cityNames}
                    onChange={(v) => handleChange('city', v)}
                    icon={Building2}
                    disabled={!value.region}
                    compact={compact}
                />
            </div>

            {!isVertical && hasActive && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {(
                        [
                            ['Continente', value.continent],
                            ['Nazione', value.nation],
                            ['Regione', value.region],
                            ['Zona', value.zone],
                            ['Città', value.city],
                        ] as const
                    )
                        .filter(([, v]) => v)
                        .map(([label, v]) => (
                            <span
                                key={label}
                                className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-1 text-[10px] font-semibold text-indigo-200"
                            >
                                <span className="text-indigo-400/80 uppercase tracking-wider">{label}</span>
                                {v}
                            </span>
                        ))}
                </div>
            )}
        </div>
    );
};
