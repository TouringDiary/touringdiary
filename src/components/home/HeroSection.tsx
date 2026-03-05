
import React from 'react';
import { CitySummary } from '../../types/index';
import { useHeroLogic } from '../../hooks/ui/useHeroLogic';
import { HeroFilterModule } from './hero/HeroFilterModule';
import { HeroAiModule } from './hero/HeroAiModule';

interface HeroSectionProps {
    activeCategories: string[];
    setActiveCategories: (cats: string[]) => void;
    onSelectCity: (id: string) => void;
    selectedZone: string;
    setSelectedZone: (z: string) => void;
    cityManifest: CitySummary[]; 
}

export const HeroSection = (props: HeroSectionProps) => {
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
        handleAiSubmit
    } = useHeroLogic(props);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[16rem] transition-all duration-500 ease-in-out">
            
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

                // Data
                uniqueZones={uniqueZones}
                filteredCities={filteredCities}
                searchResults={searchResults}
                geoOptions={geoOptions} // NEW PROP
                
                // Refs
                searchRef={searchRef}

                // Handlers
                setIsFiltersExpanded={setIsFiltersExpanded}
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
            />
            
            {/* DESTRA: AI CONSULTANT */}
            <HeroAiModule 
                isAiExpanded={isAiExpanded}
                isAiLoading={isAiLoading}
                aiResponse={aiResponse}
                typingText={typingText}
                aiQuery={aiQuery}
                setIsAiExpanded={setIsAiExpanded}
                setAiQuery={setAiQuery}
                setAiResponse={setAiResponse}
                handleAiSubmit={handleAiSubmit}
            />
        </div>
    );
};
