import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, X, Check } from 'lucide-react';
import { getCityNameById, searchCitiesByName, CitySuggestion } from '../../services/geoRegistryService';
import { AnchoredPopover } from '@/components/common/AnchoredPopover';

const MIN_SEARCH_LENGTH = 2;

interface CitySelectorProps {
    value: string;
    onChange: (cityId: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
}

export const CitySelector: React.FC<CitySelectorProps> = ({
    value,
    onChange,
    placeholder = "Cerca Comune (es. Firenze, Napoli...)",
    className = "",
    required = false
}) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedName, setSelectedName] = useState('');
    const [panelWidth, setPanelWidth] = useState<number | undefined>(undefined);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const anchorRef = useRef<HTMLDivElement>(null);

    // Keep display label in sync when parent value changes (prefill / GPS / reset).
    // AbortController cancels the in-flight registry request when `value` changes
    // again before the previous response arrives (avoids wasted network + stale apply).
    useEffect(() => {
        if (!value) {
            setSelectedName('');
            setQuery('');
            return;
        }

        const ac = new AbortController();

        const fetchCityName = async () => {
            const name = await getCityNameById(value, ac.signal);
            if (ac.signal.aborted) return;
            if (name) {
                setSelectedName(name);
                setQuery(name);
            } else {
                setSelectedName(value);
                setQuery(value);
            }
        };

        void fetchCityName();
        return () => {
            ac.abort();
        };
    }, [value]);

    // Ricerca asincrona
    const searchCities = useCallback(async (searchText: string) => {
        if (searchText.length < MIN_SEARCH_LENGTH) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const results = await searchCitiesByName(searchText);
            setSuggestions(results);
        } catch (err) {
            console.error('[CitySelector] Error searching cities:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce manuale semplice
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen && query !== selectedName) {
                searchCities(query);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query, isOpen, selectedName, searchCities]);

    const showSuggestions = isOpen && query.length >= MIN_SEARCH_LENGTH;

    // useLayoutEffect is intentional: width must be set before the portaled popover
    // paints/measures, otherwise AnchoredPopover can flash at the wrong width then snap.
    useLayoutEffect(() => {
        if (!showSuggestions) return;
        const width = anchorRef.current?.getBoundingClientRect().width;
        if (width && Number.isFinite(width)) setPanelWidth(width);
    }, [showSuggestions, query]);

    const handleSelect = (city: CitySuggestion) => {
        setSelectedName(city.name);
        setQuery(city.name);
        onChange(city.id);
        setIsOpen(false);
    };

    const clearSelection = () => {
        setSelectedName('');
        setQuery('');
        onChange('');
        setIsOpen(true);
    };

    return (
        <div ref={wrapperRef} className={`relative w-full ${className}`}>
            <div ref={anchorRef} className="relative group">
                <MapPin className={`absolute left-3 top-3.5 w-4 h-4 transition-colors ${isOpen ? 'text-indigo-400' : 'text-slate-500 group-focus-within:text-indigo-400'}`} />

                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    required={required}
                    className={`w-full bg-slate-900 border ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-700'} rounded-xl p-3 pl-10 text-white focus:outline-none text-sm transition-all placeholder:text-slate-600`}
                />

                <div className="absolute right-3 top-3 flex items-center gap-2">
                    {isLoading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                    {query && (
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="bg-slate-800 hover:bg-slate-700 p-1 rounded-full transition-colors"
                        >
                            <X className="w-3 h-3 text-slate-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Portaled list: Foundation modal_container uses overflow-hidden — absolute dropdowns are clipped. */}
            <AnchoredPopover
                isOpen={showSuggestions}
                onClose={() => {
                    setIsOpen(false);
                    setQuery(selectedName);
                }}
                anchorRef={anchorRef}
                align="left"
                role="listbox"
                className="bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                style={panelWidth ? { width: panelWidth } : undefined}
                closeOnEscape
                closeOnClickOutside
            >
                {suggestions.length > 0 ? (
                    <div className="max-h-[min(40vh,300px)] overflow-y-auto custom-scrollbar p-2">
                        {suggestions.map((city) => (
                            <button
                                key={city.id}
                                type="button"
                                onClick={() => handleSelect(city)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-between group"
                            >
                                <div>
                                    <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{city.name}</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-medium tracking-wider">
                                        {city.province ? `${city.province}, ` : ''}{city.region}
                                    </p>
                                </div>
                                {value === city.id && <Check className="w-4 h-4 text-emerald-500" />}
                            </button>
                        ))}
                    </div>
                ) : (
                    !isLoading && (
                        <div className="p-8 text-center">
                            <Search className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 font-medium">Nessun comune trovato per "{query}"</p>
                        </div>
                    )
                )}
            </AnchoredPopover>
        </div>
    );
};
