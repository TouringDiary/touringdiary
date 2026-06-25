
import React from 'react';
import { CitySummary } from '../../types/index';
import { useHeroLogic } from '../../hooks/ui/useHeroLogic';
import { useMobileCompact } from '../../hooks/ui/useMobileCompact';
import { HeroFilterModule } from './hero/HeroFilterModule';
import { HeroAiModule } from './hero/HeroAiModule';

interface HeroSectionProps {
    activeCategories: string[];
    setActiveCategories: (cats: string[]) => void;
    onSelectCity: (id: string) => void;
    selectedZone: string;
    setSelectedZone: (z: string) => void;
    selectedSeason: string;
    setSelectedSeason: (s: string) => void;
    cityManifest: CitySummary[]; 
    onFilteredCitiesChange?: (cities: CitySummary[]) => void;
}

export const HeroSection = (props: HeroSectionProps) => {
    const isMobileCompact = useMobileCompact();

    // --- BUSINESS LOGIC (HOOK) ---
    const {
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
        
        uniqueZones,
        filteredCities,
        searchResults,
        geoOptions, // NEW
        
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
        setSelectedSeason
    } = useHeroLogic(props);

    React.useEffect(() => {
        if (props.onFilteredCitiesChange) {
            props.onFilteredCitiesChange(filteredCities);
        }
    }, [filteredCities, props.onFilteredCitiesChange]);

    const handleSetFiltersExpanded = React.useCallback(
        (expanded: boolean) => {
            setIsFiltersExpanded(expanded);
            if (expanded && isMobileCompact) {
                setIsAiExpanded(false);
            }
        },
        [isMobileCompact, setIsFiltersExpanded, setIsAiExpanded]
    );

    const handleSetAiExpanded = React.useCallback(
        (expanded: boolean) => {
            setIsAiExpanded(expanded);
            if (expanded && isMobileCompact) {
                setIsFiltersExpanded(false);
            }
        },
        [isMobileCompact, setIsFiltersExpanded, setIsAiExpanded]
    );

    const mobileHeroExpanded = isMobileCompact && (isFiltersExpanded || isAiExpanded);

    return (
        <div
            className={`grid gap-2 md:gap-4 transition-all duration-300 ease-in-out lg:grid-cols-12 lg:h-[16rem] ${
                isMobileCompact
                    ? mobileHeroExpanded
                        ? 'grid-cols-1'
                        : 'grid-cols-2 items-stretch'
                    : 'grid-cols-1'
            }`}
        >
            
            {/* SINISTRA: FILTRI & RICERCA */}
            <HeroFilterModule 
                // State
                continent={continent}
                nation={nation}
                region={region}
                selectedCity={selectedCity}
                selectedZone={props.selectedZone}
                isFiltersExpanded={isFiltersExpanded}
                manualCitySearch={manualCitySearch}
                isSearchFocused={isSearchFocused}
                heroImage={heroImage}
                activeCategories={props.activeCategories}
                selectedSeason={selectedSeason}
                isMobileCompact={isMobileCompact}

                // Data
                uniqueZones={uniqueZones}
                filteredCities={filteredCities}
                searchResults={searchResults}
                geoOptions={geoOptions} // NEW PROP
                
                // Refs
                searchRef={searchRef}

                // Handlers
                setIsFiltersExpanded={handleSetFiltersExpanded}
                setManualCitySearch={setManualCitySearch}
                setIsSearchFocused={setIsSearchFocused}
                handleContinentChange={handleContinentChange}
                resetContinent={resetContinent}
                handleNationChange={handleNationChange}
                resetNation={resetNation}
                handleRegionChange={handleRegionChange}
                resetRegion={resetRegion}
                handleZoneChange={handleZoneChange}
                resetZone={resetZone}
                handleCityChange={handleCityChange}
                resetCity={resetCity}
                handleGlobalReset={handleGlobalReset}
                handleToggleCategory={handleToggleCategory}
                handleSeasonClick={handleSeasonClick}
                handleManualCitySelect={handleManualCitySelect}
                setActiveCategories={props.setActiveCategories}
                handleAiSubmit={handleAiSubmit}
            />
            
            {/* DESTRA: AI CONSULTANT */}
            <HeroAiModule 
                isAiExpanded={isAiExpanded}
                isAiLoading={isAiLoading}
                aiResponse={aiResponse}
                typingText={typingText}
                aiQuery={aiQuery}
                aiRuntimeStatus={aiRuntimeStatus}
                isMobileCompact={isMobileCompact}
                setIsAiExpanded={handleSetAiExpanded}
                setAiQuery={setAiQuery}
                setAiResponse={setAiResponse}
                handleAiSubmit={handleAiSubmit}
            />
        </div>
    );
};
