
import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { CitySummary } from '../../types/index';
import { useHeroLogic } from '../../hooks/ui/useHeroLogic';
import { useMobileCompact } from '../../hooks/ui/useMobileCompact';
import { useHeroStackedLayout } from '../../hooks/ui/useHeroStackedLayout';
import { useFlipSwap } from '../../hooks/ui/useFlipSwap';
import { HeroFilterModule } from './hero/HeroFilterModule';
import { HeroAiModule } from './hero/HeroAiModule';

export type HeroStackedMode = 'desktop' | 'compact' | 'expanded' | 'minimal';

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
    const isStackedLayout = useHeroStackedLayout();
    const isMobileCompact = useMobileCompact();

    const filterSlotRef = useRef<HTMLDivElement>(null);
    const aiSlotRef = useRef<HTMLDivElement>(null);
    const stackRef = useRef<HTMLDivElement>(null);

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
        geoOptions,
        
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

    // Stacked layout: only one module can be open at a time.
    React.useEffect(() => {
        if (isStackedLayout && isAiExpanded && isFiltersExpanded) {
            setIsFiltersExpanded(false);
        }
    }, [isStackedLayout, isAiExpanded, isFiltersExpanded, setIsFiltersExpanded]);

    const handleSetFiltersExpanded = React.useCallback(
        (expanded: boolean) => {
            setIsFiltersExpanded(expanded);
            if (expanded && isStackedLayout) {
                setIsAiExpanded(false);
            }
        },
        [isStackedLayout, setIsFiltersExpanded, setIsAiExpanded]
    );

    const handleSetAiExpanded = React.useCallback(
        (expanded: boolean) => {
            setIsAiExpanded(expanded);
            if (expanded && isStackedLayout) {
                setIsFiltersExpanded(false);
            }
        },
        [isStackedLayout, setIsFiltersExpanded, setIsAiExpanded]
    );

    const anyExpanded = isStackedLayout && (isFiltersExpanded || isAiExpanded);

    const moduleOrder = useMemo((): ('filter' | 'ai')[] => {
        if (!anyExpanded) return ['filter', 'ai'];
        if (isAiExpanded && !isFiltersExpanded) return ['ai', 'filter'];
        return ['filter', 'ai'];
    }, [anyExpanded, isAiExpanded, isFiltersExpanded]);

    const orderKey = moduleOrder.join('-');

    const filterMode: HeroStackedMode = !isStackedLayout
        ? 'desktop'
        : !anyExpanded
            ? 'compact'
            : isFiltersExpanded
                ? 'expanded'
                : 'minimal';

    const aiMode: HeroStackedMode = !isStackedLayout
        ? 'desktop'
        : !anyExpanded
            ? 'compact'
            : isAiExpanded
                ? 'expanded'
                : 'minimal';

    const flipRefs = useMemo(
        () => ({ filter: filterSlotRef, ai: aiSlotRef }),
        []
    );

    useFlipSwap({
        enabled: isStackedLayout,
        orderKey,
        refs: flipRefs,
    });

    // Single owner of scroll stability for the stacked hero: keeps the viewport
    // visually fixed across expand/collapse and module-swap layout changes.
    const stackAnchorTopRef = useRef(0);
    const stackScrollYRef = useRef(0);

    useLayoutEffect(() => {
        if (!isStackedLayout || !stackRef.current) return;

        const topAfter = stackRef.current.getBoundingClientRect().top;
        const topBefore = stackAnchorTopRef.current;

        if (topBefore !== 0 && Math.abs(topAfter - topBefore) > 0.5) {
            // Numeric form (no `behavior`) for an immediate, maximally-compatible jump.
            window.scrollTo(0, stackScrollYRef.current - (topAfter - topBefore));
        }

        stackScrollYRef.current = window.scrollY;
        stackAnchorTopRef.current = stackRef.current.getBoundingClientRect().top;
    }, [isStackedLayout, isFiltersExpanded, isAiExpanded]);

    const filterModule = (
        <HeroFilterModule 
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
            isStackedLayout={isStackedLayout}
            stackedMode={filterMode}
            uniqueZones={uniqueZones}
            filteredCities={filteredCities}
            searchResults={searchResults}
            geoOptions={geoOptions}
            searchRef={searchRef}
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
    );

    const aiModule = (
        <HeroAiModule 
            isAiExpanded={isAiExpanded}
            isAiLoading={isAiLoading}
            aiResponse={aiResponse}
            typingText={typingText}
            aiQuery={aiQuery}
            aiRuntimeStatus={aiRuntimeStatus}
            isMobileCompact={isMobileCompact}
            isStackedLayout={isStackedLayout}
            stackedMode={aiMode}
            setIsAiExpanded={handleSetAiExpanded}
            setAiQuery={setAiQuery}
            setAiResponse={setAiResponse}
            handleAiSubmit={handleAiSubmit}
        />
    );

    const gridLayoutClass = isStackedLayout
        ? anyExpanded
            ? 'grid-cols-1'
            : 'grid-cols-2 items-stretch'
        : 'grid-cols-1';

    return (
        <div
            ref={stackRef}
            className={`grid gap-2 md:gap-4 lg:grid-cols-12 lg:h-[16rem] ${gridLayoutClass}`}
        >
            {moduleOrder.map((moduleId) => {
                if (moduleId === 'filter') {
                    return (
                        <div
                            key="filter"
                            ref={filterSlotRef}
                            className="min-w-0 col-span-1 lg:col-span-7"
                        >
                            {filterModule}
                        </div>
                    );
                }
                return (
                    <div
                        key="ai"
                        ref={aiSlotRef}
                        className="min-w-0 col-span-1 lg:col-span-5"
                    >
                        {aiModule}
                    </div>
                );
            })}
        </div>
    );
};
