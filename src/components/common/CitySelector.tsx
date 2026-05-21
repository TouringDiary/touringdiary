import { Z_MODAL_NESTED } from '@/constants/zIndex';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, X, Check } from 'lucide-react';
import { getCityNameById, searchCitiesByName, CitySuggestion } from '../../services/geoRegistryService';


// Local CitySuggestion removed
//

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

    const wrapperRef = useRef<HTMLDivElement>(null);

    // Effetto per caricare il nome iniziale se abbiamo un value (ID)
    useEffect(() => {
        if (value && !selectedName) {
            const fetchCityName = async () => {
                const name = await getCityNameById(value);
                if (name) {
                    setSelectedName(name);
                    setQuery(name);
                } else {

                    setSelectedName(value);
                    setQuery(value);
                }





            };
            fetchCityName();
        }
    }, [value]);

    // Chiusura al click fuori
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Se non abbiamo selezionato nulla, resettiamo al nome selezionato precedentemente
                setQuery(selectedName);
            }
        };
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, [selectedName]);

    // Ricerca asincrona
    const searchCities = useCallback(async (searchText: string) => {
        if (searchText.length < 2) {
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
            <div className="relative group">
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

            {/* Suggerimenti Dropdown */}
            {isOpen && query.length >= 2 && (
                <div
                    className="absolute mt-2 w-full bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{ zIndex: Z_MODAL_NESTED }}
                >
                    {suggestions.length > 0 ? (
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
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
                </div>
            )}
        </div>
    );
};



