import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CitySummary } from '../../types/index';
import { generateChatReply } from '../../services/ai/aiText';
import { aiErrorUserMessage, isAiEdgeError } from '../../services/ai/aiEdgeErrors';
import { getAiRuntimeStatus } from '../../services/ai/aiRuntimeStatus';
import { getSetting, SETTINGS_KEYS } from '../../services/settingsService';
import { getUniqueCityTypes, getActiveContinents, getActiveNations, getActiveRegions, getActiveTouristZones } from '../../services/geoRegistryService';

interface UseHeroLogicProps {
    cityManifest: CitySummary[];
    activeCategories: string[];
    setActiveCategories: (cats: string[]) => void;
    onSelectCity: (id: string) => void;
    selectedZone: string;
    setSelectedZone: (z: string) => void;
    selectedSeason: string;
    setSelectedSeason: (s: string) => void;
}

export interface GeoSelectOption {
    label: string;
    value: string;
    slug: string;
}

export interface InspirationOption {
    id: string;
    label: string;
    compatibleCategories: string[];
    [key: string]: any;
}

export interface GeoOptionsState {
    continents: GeoSelectOption[];
    nations: GeoSelectOption[];
    regions: GeoSelectOption[];
    zones: GeoSelectOption[];
    tipologiaOptions: string[];
    inspirationOptions: InspirationOption[];
}

export const useHeroLogic = ({
    cityManifest,
    activeCategories,
    setActiveCategories,
    onSelectCity,
    selectedZone,
    setSelectedZone,
    selectedSeason,
    setSelectedSeason
}: UseHeroLogicProps) => {
    
    // --- STATE: FILTRI GEOGRAFICI ---
    const [continent, setContinent] = useState<string>('');
    const [nation, setNation] = useState<string>('');
    const [region, setRegion] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

    // --- OPTIONS STATE (FROM DB) ---
    const [geoOptions, setGeoOptions] = useState<GeoOptionsState>({
        continents: [],
        nations: [],
        regions: [],
        zones: [],
        tipologiaOptions: [],
        inspirationOptions: []
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



    const TIPOLOGIA_WHITELIST = ['mare', 'montagna', 'laghi_fiumi', 'cultura', 'weekend', 'borghi'];

    // --- HELPERS: Data-Driven Matching ---
    const matchesInspiration = (cityTypes: string[], inspirationId: string) => {
        const inspiration = geoOptions.inspirationOptions.find(i => i.id === inspirationId || i.label === inspirationId);
        if (!inspiration || !inspiration.compatibleCategories) return false;
        
        const normalizedTypes = cityTypes.map(t => t === 'lago' ? 'laghi_fiumi' : t);
        return inspiration.compatibleCategories.some((cat: string) => normalizedTypes.includes(cat));
    };

    const getSeasonTargetType = (season: string): string => {
        const seasonMapping: Record<string, string> = {
            'primavera': 'borghi',
            'estate': 'mare',
            'autunno': 'cultura',
            'inverno': 'montagna'
        };
        return seasonMapping[season.toLowerCase()] || '';
    };

    // --- COMPUTED: Unique Zones ---
    const uniqueZones = useMemo(() => Array.from(new Set(cityManifest.map(c => c.zone))).sort(), [cityManifest]);

    // --- COMPUTED: Filtered Cities (Dropdown) ---
    const filteredCities = useMemo(() => {
        let list = cityManifest;

        // 1. Filtro Geografico (Zona e Regione)
        if (selectedZone) {
            list = list.filter(c => c.tourist_zone_id === selectedZone);
        } else if (region) {
            list = list.filter(c => c.region_id === region);
        } else if (nation) {
            // Se abbiamo solo la nazione, potremmo filtrare per nation_id se lo avessimo nel manifest
            // Per ora il manifest ha adminRegion e zone.
        }

        // 2. Filtro Categorie (Tipologia & Ispirazione) - Logica OR
        if (activeCategories && activeCategories.length > 0) {
            list = list.filter(c => {
                const cityTypes = (c.cityTypes || []).map(t => t === 'lago' ? 'laghi_fiumi' : t);
                
                return activeCategories.some(activeCat => {
                    // Se è una Tipologia
                    if (TIPOLOGIA_WHITELIST.includes(activeCat)) {
                        return cityTypes.includes(activeCat);
                    }
                    
                    // Se è un'Ispirazione
                    return matchesInspiration(cityTypes, activeCat);
                });
            });
        }

        // 3. Filtro Stagione (Indipendente)
        if (selectedSeason) {
            const targetType = getSeasonTargetType(selectedSeason);
            if (targetType) {
                list = list.filter(c => (c.cityTypes || []).includes(targetType));
            }
        }

        return list;
    }, [selectedZone, cityManifest, activeCategories, selectedSeason]);

    const searchResults = useMemo(() => {
        if (!manualCitySearch.trim()) return [];
        const query = manualCitySearch.toLowerCase();
        return cityManifest
            .filter(c => c.name.toLowerCase().includes(query))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [manualCitySearch, cityManifest]);

    // --- EFFECT: Load Settings & Suggestions & Initial Geo ---
    useEffect(() => {
        const loadSettings = async () => {

            setHeroImage('');
            setAiBgImage(null);

            // Load Typing Suggestions
            const suggestions = await getSetting<string[]>(SETTINGS_KEYS.AI_TYPING_SUGGESTIONS);
            if (suggestions && Array.isArray(suggestions) && suggestions.length > 0) {
                setAiSuggestions(suggestions);
            } else {
                setAiSuggestions(["Cosa visitare a Napoli?", "Migliori spiagge Cilento?", "Dove mangiare la pizza?"]);
            }
            
            // Load Tipologie
            const templates = await getUniqueCityTypes();
            const uniqueTypes = Array.from(new Set((templates || []).map(t => t === 'lago' ? 'laghi_fiumi' : t)))
                .filter(t => TIPOLOGIA_WHITELIST.includes(t as string));

            // Load Ispirazioni
            const inspirations = await getSetting<any[]>(SETTINGS_KEYS.TRAVEL_STYLES_CONFIG);

            // Load Continents (Level 1)
            const continentsData = await getActiveContinents();
            
            setGeoOptions(prev => ({
                ...prev,
                continents: (continentsData || []).map(c => ({ label: c.name, value: c.id, slug: c.slug })),
                tipologiaOptions: uniqueTypes,
                inspirationOptions: inspirations || []
            }));
        };
        loadSettings();
    }, []);

    // --- EFFECT: Dynamic Geo Loading (Nations, Regions, Zones) ---
    useEffect(() => {
        let active = true;
        const loadNations = async () => {
            if (!continent) {
                setGeoOptions(prev => ({ ...prev, nations: [], regions: [], zones: [] }));
                return;
            }
            const data = await getActiveNations(continent);
            if (!active) return;
            setGeoOptions(prev => ({ ...prev, nations: (data || []).map(n => ({ label: n.name, value: n.id, slug: n.slug })), regions: [], zones: [] }));
        };
        loadNations();
        return () => { active = false; };
    }, [continent]);

    useEffect(() => {
        let active = true;
        const loadRegions = async () => {
            if (!nation) {
                setGeoOptions(prev => ({ ...prev, regions: [], zones: [] }));
                return;
            }
            const data = await getActiveRegions(nation);
            if (!active) return;
            setGeoOptions(prev => ({ ...prev, regions: (data || []).map(r => ({ label: r.name, value: r.id, slug: r.slug })), zones: [] }));
        };
        loadRegions();
        return () => { active = false; };
    }, [nation]);

    useEffect(() => {
        let active = true;
        const loadZones = async () => {
            if (!region) {
                setGeoOptions(prev => ({ ...prev, zones: [] }));
                return;
            }
            const data = await getActiveTouristZones(region);
            if (!active) return;
            setGeoOptions(prev => ({ ...prev, zones: (data || []).map(z => ({ label: z.name, value: z.id, slug: z.slug })) }));
        };
        loadZones();
        return () => { active = false; };
    }, [region]);

    // --- EFFECT: Dynamic Auto-Default (Data-Driven) ---
    useEffect(() => {
        // Applichiamo il default solo se il campo è attualmente vuoto (per non sovrascrivere selezioni manuali)
        // e se esiste esattamente una sola opzione disponibile nel database.
        
        if (!continent && geoOptions.continents.length === 1) {
            const onlyVal = geoOptions.continents[0];
            const val = typeof onlyVal === 'string' ? onlyVal : onlyVal.value;
            if (val) setContinent(val);
        }

        if (!nation && geoOptions.nations.length === 1) {
            const onlyVal = geoOptions.nations[0];
            const val = typeof onlyVal === 'string' ? onlyVal : onlyVal.value;
            if (val) setNation(val);
        }

        if (!region && geoOptions.regions.length === 1) {
            const onlyVal = geoOptions.regions[0];
            const val = typeof onlyVal === 'string' ? onlyVal : onlyVal.value;
            if (val) setRegion(val);
        }
    }, [geoOptions.continents, geoOptions.nations, geoOptions.regions, continent, nation, region]);

    // --- EFFECT: Click Outside Search ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
        };
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
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
                // Se la città ha zone/region impostati come stringhe, cerca di mapparli agli slug corretti
                // Per una corretta propagazione a ritroso, sarebbe ideale usare gli ID o mappare i nomi
                // Ma poiché cityManifest potrebbe ancora usare stringhe grezze come 'Campania', facciamo un match:
                
                if (!selectedZone && city.zone) {
                    const matchedZone = geoOptions.zones.find(z => z.label.toLowerCase() === city.zone.toLowerCase());
                    if (matchedZone) setSelectedZone(matchedZone.value);
                }
                if (!region && city.adminRegion) {
                    const matchedRegion = geoOptions.regions.find(r => r.label.toLowerCase() === city.adminRegion.toLowerCase());
                    if (matchedRegion) setRegion(matchedRegion.value);
                }
                if (!nation && city.nation) {
                    const matchedNation = geoOptions.nations.find(n => n.label.toLowerCase() === city.nation.toLowerCase());
                    if (matchedNation) setNation(matchedNation.value);
                }
                if (!continent && city.continent) {
                    const matchedCont = geoOptions.continents.find(c => c.label.toLowerCase() === city.continent.toLowerCase());
                    if (matchedCont) setContinent(matchedCont.value);
                }
                
                onSelectCity(cityId);
            }
        }
    };
    const resetCity = () => { setSelectedCity(''); };

    const handleGlobalReset = () => {
        setContinent(''); setNation(''); setRegion(''); setSelectedZone(''); setSelectedCity(''); setActiveCategories([]); setSelectedSeason('');
    };

    // --- HANDLERS: Categories ---
    const handleToggleCategory = (categoryToSet: string) => {
        if (activeCategories.includes(categoryToSet)) {
            setActiveCategories(activeCategories.filter(c => c !== categoryToSet));
        } else {
            setActiveCategories([...activeCategories, categoryToSet]);
        }
    };

    const handleSeasonClick = (season: string) => {
        const seasonLower = season.toLowerCase();
        if (selectedSeason === seasonLower) {
            setSelectedSeason('');
        } else {
            setSelectedSeason(seasonLower);
        }
    };



    // --- HANDLERS: Manual Search ---
    const handleManualCitySelect = (id: string) => {
        setManualCitySearch('');
        setIsSearchFocused(false);
        onSelectCity(id);
    };

    // --- HANDLERS: AI ---
    const aiRuntimeStatus = getAiRuntimeStatus();

    const handleAiSubmit = async (queryOverride?: string) => {
        if (isAiLoading) return;

        if (!aiRuntimeStatus.available) {
            setAiResponse(aiRuntimeStatus.message || 'I servizi AI non sono disponibili al momento.');
            setIsAiExpanded(true);
            return;
        }

        let userInput = queryOverride || aiQuery;
        if (!userInput.trim()) return;

        // --- CONTEXT ENHANCEMENT FOR SHORTLIST ---
        if (userInput === 'Shortlist AI analysis') {
            const cityNames = filteredCities.slice(0, 15).map(c => c.name).join(', ');
            const seasonLabel = selectedSeason ? `per la stagione ${selectedSeason}` : 'per questo periodo';
            const catLabels = activeCategories.length > 0 ? `con focus su: ${activeCategories.join(', ')}` : '';
            
            userInput = `Analizza questa shortlist di destinazioni: ${cityNames}. 
                Suggerisci la meta ideale ${seasonLabel} ${catLabels}. 
                Basati esclusivamente su esperienze autentiche degli utenti, caratteristiche morfologiche del territorio, eventi locali e servizi disponibili.
                Non considerare contenuti promozionali o sponsorizzati. 
                Fornisci una raccomandazione motivata e coinvolgente.`;
        }

        if (queryOverride) {
            setAiQuery(queryOverride === 'Shortlist AI analysis' ? 'Suggeriscimi la meta ideale tra queste...' : userInput);
        }
        
        setIsAiLoading(true);
        setAiResponse('');
        setIsAiExpanded(true); 

        try {
            const aiResponseText = await generateChatReply(userInput);
            setAiResponse(aiResponseText);
        } catch (err: unknown) {
            if (isAiEdgeError(err)) {
                setAiResponse(err.message);
            } else {
                setAiResponse(aiErrorUserMessage(err, 'Spiacenti, il nostro consulente non è disponibile al momento.'));
            }
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
        aiRuntimeStatus,
        selectedSeason,
        setSelectedSeason,
        geoOptions
    };
};