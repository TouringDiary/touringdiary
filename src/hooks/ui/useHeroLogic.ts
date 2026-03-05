
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CitySummary } from '../../types/index';
import { generateCitySuggestion } from '../../services/ai';
import { getSetting, getCachedSetting, SETTINGS_KEYS } from '../../services/settingsService';
import { FALLBACK_CONTINENTS, FALLBACK_NATIONS, FALLBACK_REGIONS, FALLBACK_CATEGORIES } from '../../data/ui/heroConstants';

interface UseHeroLogicProps {
    cityManifest: CitySummary[];
    activeCategories: string[];
    setActiveCategories: (cats: string[]) => void;
    onSelectCity: (id: string) => void;
    selectedZone: string;
    setSelectedZone: (z: string) => void;
}

export const useHeroLogic = ({
    cityManifest,
    activeCategories,
    setActiveCategories,
    onSelectCity,
    selectedZone,
    setSelectedZone
}: UseHeroLogicProps) => {
    
    // --- STATE: FILTRI GEOGRAFICI ---
    const [continent, setContinent] = useState<string>('europa');
    const [nation, setNation] = useState<string>('italia');
    const [region, setRegion] = useState<string>('campania');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

    // --- OPTIONS STATE (FROM DB) ---
    const [geoOptions, setGeoOptions] = useState<any>({
        continents: FALLBACK_CONTINENTS,
        nations: FALLBACK_NATIONS,
        regions: FALLBACK_REGIONS
    });
    
    // --- STATE: RICERCA MANUALE ---
    const [manualCitySearch, setManualCitySearch] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // --- STATE: AI ---
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isAiExpanded, setIsAiExpanded] = useState(false);
    const [aiBgImage, setAiBgImage] = useState<string | null>(null);

    // --- STATE: VISUALS (TYPING & HERO) ---
    const [heroImage, setHeroImage] = useState<string>('');
    const [typingText, setTypingText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(100);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

    // --- COMPUTED: Unique Zones ---
    const uniqueZones = useMemo(() => Array.from(new Set(cityManifest.map(c => c.zone))).sort(), [cityManifest]);

    // --- COMPUTED: Filtered Cities (Dropdown) ---
    const filteredCities = useMemo(() => {
        let list = cityManifest;
        if (selectedZone) list = list.filter(c => c.zone === selectedZone);
        return list;
    }, [selectedZone, cityManifest]);

    // --- COMPUTED: Search Results (Manual) ---
    const searchResults = useMemo(() => {
        if (!manualCitySearch.trim()) return [];
        return cityManifest.filter(c => c.name.toLowerCase().includes(manualCitySearch.toLowerCase()));
    }, [manualCitySearch, cityManifest]);

    // --- EFFECT: Load Settings & Suggestions ---
    useEffect(() => {
        const loadSettings = async () => {
            // 1. Load Design
            const settings = await getSetting<{heroImage: string, ai_consultant_bg?: string}>(SETTINGS_KEYS.SITE_DESIGN);
            if (settings) {
                if (settings.heroImage) setHeroImage(settings.heroImage);
                if (settings.ai_consultant_bg) setAiBgImage(settings.ai_consultant_bg);
            }

            // 2. Load Typing Suggestions
            const suggestions = await getSetting<string[]>(SETTINGS_KEYS.AI_TYPING_SUGGESTIONS);
            if (suggestions && Array.isArray(suggestions) && suggestions.length > 0) {
                setAiSuggestions(suggestions);
            } else {
                setAiSuggestions(["Cosa visitare a Napoli?", "Migliori spiagge Cilento?", "Dove mangiare la pizza?"]);
            }
            
            // 3. Load Geo Options from DB
            const geoDb = await getSetting<any>(SETTINGS_KEYS.GEO_OPTIONS);
            if (geoDb) {
                setGeoOptions({
                    continents: geoDb.continents || FALLBACK_CONTINENTS,
                    nations: geoDb.nations || FALLBACK_NATIONS,
                    regions: geoDb.admin_regions || FALLBACK_REGIONS
                });
            }
        };
        loadSettings();
    }, []);

    // --- EFFECT: Click Outside Search ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- EFFECT: Typing Animation ---
    useEffect(() => {
        if (aiResponse || isAiLoading || aiSuggestions.length === 0) return;

        const handleType = () => {
            const i = loopNum % aiSuggestions.length;
            const fullText = aiSuggestions[i];

            setTypingText(isDeleting 
                ? fullText.substring(0, typingText.length - 1) 
                : fullText.substring(0, typingText.length + 1)
            );

            let speed = isDeleting ? 30 : 60;
            if (!isDeleting && typingText === fullText) {
                speed = 2500; 
                setIsDeleting(true);
            } else if (isDeleting && typingText === '') {
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
                speed = 500;
            }
            setTypingSpeed(speed);
        };

        const timer = setTimeout(handleType, typingSpeed);
        return () => clearTimeout(timer);
    }, [typingText, isDeleting, loopNum, typingSpeed, aiResponse, isAiLoading, aiSuggestions]);

    // --- HANDLERS: Filters ---
    const handleContinentChange = (e: React.ChangeEvent<HTMLSelectElement>) => { setContinent(e.target.value); setNation(''); setRegion(''); setSelectedZone(''); setSelectedCity(''); };
    const resetContinent = () => { setContinent(''); setNation(''); setRegion(''); setSelectedZone(''); setSelectedCity(''); };

    const handleNationChange = (e: React.ChangeEvent<HTMLSelectElement>) => { setNation(e.target.value); setRegion(''); setSelectedZone(''); setSelectedCity(''); };
    const resetNation = () => { setNation(''); setRegion(''); setSelectedZone(''); setSelectedCity(''); };

    const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => { setRegion(e.target.value); setSelectedZone(''); setSelectedCity(''); };
    const resetRegion = () => { setRegion(''); setSelectedZone(''); setSelectedCity(''); };

    const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => { setSelectedZone(e.target.value); setSelectedCity(''); };
    const resetZone = () => { setSelectedZone(''); setSelectedCity(''); };

    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cityId = e.target.value;
        setSelectedCity(cityId);
        if (cityId) {
            const city = cityManifest.find(c => c.id === cityId);
            if (city) {
                if (!selectedZone) setSelectedZone(city.zone);
                if (!region) setRegion('campania');
                if (!nation) setNation('italia');
                if (!continent) setContinent('europa');
                onSelectCity(cityId);
            }
        }
    };
    const resetCity = () => { setSelectedCity(''); };

    const handleGlobalReset = () => {
        setContinent('europa'); setNation('italia'); setRegion('campania'); setSelectedZone(''); setSelectedCity(''); setActiveCategories([]);
    };

    // --- HANDLERS: Categories ---
    const handleToggleCategory = (categoryToSet: string) => {
        if (activeCategories.includes(categoryToSet)) {
            setActiveCategories(activeCategories.filter(c => c !== categoryToSet));
        } else {
            setActiveCategories([...activeCategories, categoryToSet]);
        }
    };

    const handleSeasonClick = (label: string) => {
        let categoryToSet = '';
        switch(label) {
            case 'Prima': categoryToSet = 'Natura'; break;
            case 'Est': categoryToSet = 'Mare'; break;
            case 'Aut': categoryToSet = 'Vino'; break;
            case 'Inv': categoryToSet = 'Cultura'; break;
        }
        if (categoryToSet) handleToggleCategory(categoryToSet);
    };

    // --- HANDLERS: Manual Search ---
    const handleManualCitySelect = (id: string) => {
        setManualCitySearch('');
        setIsSearchFocused(false);
        onSelectCity(id);
    };

    // --- HANDLERS: AI ---
    const handleAiSubmit = async (queryOverride?: string) => {
        const queryToUse = queryOverride || aiQuery;
        if (!queryToUse.trim()) return;
        if (queryOverride) setAiQuery(queryOverride);

        setIsAiLoading(true);
        setIsAiExpanded(true); 
        try {
            const availableCityNames = cityManifest.map(c => c.name);
            const response = await generateCitySuggestion(queryToUse, availableCityNames);
            setAiResponse(response);
        } catch (error) {
            setAiResponse("Mi dispiace, al momento non riesco a rispondere. Riprova più tardi.");
        } finally {
            setIsAiLoading(false);
        }
    };

    return {
        continent, setContinent,
        nation, setNation,
        region, setRegion,
        selectedCity, setSelectedCity,
        isFiltersExpanded, setIsFiltersExpanded,
        manualCitySearch, setManualCitySearch,
        isSearchFocused, setIsSearchFocused,
        aiQuery, setAiQuery,
        aiResponse, setAiResponse,
        isAiLoading,
        isAiExpanded, setIsAiExpanded,
        heroImage,
        typingText,
        aiBgImage,
        uniqueZones,
        filteredCities,
        searchResults,
        searchRef,
        handleContinentChange, resetContinent,
        handleNationChange, resetNation,
        handleRegionChange, resetRegion,
        handleZoneChange, resetZone,
        handleCityChange, resetCity,
        handleGlobalReset,
        handleToggleCategory,
        handleSeasonClick,
        handleManualCitySelect,
        handleAiSubmit,
        // EXPOSE GEO OPTIONS FROM DB
        geoOptions
    };
};
