import React from 'react';
import { ChevronUp, ChevronDown, RotateCcw, Waves, Mountain, Droplets, Landmark, Castle, Sparkles, Heart, Compass, Wine, PartyPopper, Scale } from 'lucide-react';
import { ImageWithFallback } from '../../common/ImageWithFallback';
import { useDynamicStyles } from '../../../hooks/useDynamicStyles';
import { FilterSelect } from './components/FilterSelect';
import { SearchBar } from './components/SearchBar';
import { CitySummary } from '../../../types/index';
import { HERO_COMPACT } from './heroCompactTokens';
import { HeroExpandableSection } from './components/HeroExpandableSection';
import { HeroCollapsedBar } from './components/HeroCollapsedBar';
import { HeroCompactTypingField } from './components/HeroCompactTypingField';
import { HERO_INSPIRATION_PHRASES } from './heroInspirationPhrases';
import { useTypingCycle } from '../../../hooks/ui/useTypingCycle';
import type { HeroStackedMode } from '../HeroSection';

interface HeroFilterModuleProps {
    continent: string;
    nation: string;
    region: string;
    selectedCity: string;
    selectedZone: string;
    isFiltersExpanded: boolean;
    manualCitySearch: string;
    isSearchFocused: boolean;
    heroImage: string;
    activeCategories: string[];
    selectedSeason?: string;
    isMobileCompact?: boolean;
    isStackedLayout?: boolean;
    stackedMode?: HeroStackedMode;

    uniqueZones: string[];
    filteredCities: CitySummary[];
    searchResults: CitySummary[];

    geoOptions?: {
        continents: any[];
        nations: any[];
        regions: any[];
        zones?: any[];
    };

    searchRef: React.RefObject<HTMLDivElement>;

    setIsFiltersExpanded: (v: boolean) => void;
    setManualCitySearch: (v: string) => void;
    setIsSearchFocused: (v: boolean) => void;
    handleContinentChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    resetContinent: () => void;
    handleNationChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    resetNation: () => void;
    handleRegionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    resetRegion: () => void;
    handleZoneChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    resetZone: () => void;
    handleCityChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    resetCity: () => void;
    handleGlobalReset: () => void;
    handleToggleCategory: (cat: string) => void;
    handleSeasonClick: (label: string) => void;
    handleManualCitySelect: (id: string) => void;
    setActiveCategories: (cats: string[]) => void;
    handleAiSubmit: (queryOverride?: string) => Promise<void>;
}

const TIPOLOGIA_OPTIONS = [
    { label: 'Mare', val: 'mare', icon: Waves, emoji: '🌊' },
    { label: 'Montagna', val: 'montagna', icon: Mountain, emoji: '🏔️' },
    { label: 'Laghi e Fiumi', val: 'laghi_fiumi', icon: Droplets, emoji: '💧' },
    { label: 'Cultura', val: 'cultura', icon: Landmark, emoji: '🏛️' },
    { label: 'Borghi', val: 'borghi', icon: Castle, emoji: '🏘️' },
    { label: 'Weekend', val: 'weekend', icon: Sparkles, emoji: '✨' }
];

const ISPIRAZIONE_OPTIONS = [
    { label: 'Romantico', val: 'romantico', icon: Heart, emoji: '❤️' },
    { label: 'Avventura', val: 'avventura', icon: Compass, emoji: '🧭' },
    { label: 'Cultura', val: 'cultura', icon: Landmark, emoji: '🏛️' },
    { label: 'Gusto', val: 'gusto', icon: Wine, emoji: '🍷' },
    { label: 'Svago', val: 'svago', icon: PartyPopper, emoji: '🎉' },
    { label: 'Equilibrato', val: 'equilibrato', icon: Scale, emoji: '⚖️' }
];

const SEASON_OPTIONS = [
    { label: 'Primavera', value: 'primavera' },
    { label: 'Estate', value: 'estate' },
    { label: 'Autunno', value: 'autunno' },
    { label: 'Inverno', value: 'inverno' }
];

export const HeroFilterModule = (props: HeroFilterModuleProps) => {
    const isMobileCompact = props.isMobileCompact ?? false;
    const isStackedLayout = props.isStackedLayout ?? false;
    const stackedMode: HeroStackedMode = props.stackedMode ?? (isStackedLayout ? 'compact' : 'desktop');
    const heroLabelStyle = useDynamicStyles('hero_label', isMobileCompact);

    const continents = props.geoOptions?.continents || [];
    const nations = props.geoOptions?.nations || [];
    const regions = props.geoOptions?.regions || [];

    const showCompactTwin = stackedMode === 'compact';
    const inspirationText = useTypingCycle(HERO_INSPIRATION_PHRASES, !showCompactTwin);

    const renderSummary = () => {
        if (props.activeCategories.length === 0) return null;

        if (props.activeCategories.includes('equilibrato')) {
            return (
                <div className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-0.5 rounded-lg border border-slate-700/50">
                    <span className="text-sm cursor-help" title="Equilibrato">⚖️</span>
                </div>
            );
        }

        const emojis: { emoji: string, label: string }[] = [];
        props.activeCategories.forEach(cat => {
            const tipOpt = TIPOLOGIA_OPTIONS.find(o => o.val === cat);
            const ispOpt = ISPIRAZIONE_OPTIONS.find(o => o.val === cat);
            if (tipOpt && !emojis.some(e => e.label === tipOpt.label)) {
                emojis.push({ emoji: tipOpt.emoji, label: tipOpt.label });
            } else if (ispOpt && !emojis.some(e => e.label === ispOpt.label)) {
                emojis.push({ emoji: ispOpt.emoji, label: ispOpt.label });
            }
        });

        if (emojis.length === 0) return null;

        const visible = emojis.slice(0, 4);
        const extra = emojis.length > 4 ? emojis.length - 4 : 0;

        return (
            <div className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-0.5 rounded-lg border border-slate-700/50">
                {visible.map((item, idx) => (
                    <span key={idx} className="text-sm cursor-help" title={item.label}>{item.emoji}</span>
                ))}
                {extra > 0 && <span className="text-[10px] font-bold text-slate-400">+{extra}</span>}
            </div>
        );
    };

    const handleSearchFocus = (focused: boolean) => {
        props.setIsSearchFocused(focused);
        if (focused && isStackedLayout) {
            props.setIsFiltersExpanded(true);
        }
    };

    const showFullFilterContent = props.isFiltersExpanded || !isStackedLayout;
    const showCitySearchPopover =
        props.isSearchFocused && props.manualCitySearch.trim().length > 0;

    const toggleExpanded = () => props.setIsFiltersExpanded(!props.isFiltersExpanded);

    // --- COMPACT TWIN (both modules closed): original side-by-side card content ---
    const renderCompactTwin = () => (
        <div className={`${HERO_COMPACT.compactTwinStack} ${HERO_COMPACT.boxPadding} ${HERO_COMPACT.bodyGap}`}>
            <div
                className={`flex justify-between items-center cursor-pointer ${HERO_COMPACT.headerRowAi}`}
                onClick={toggleExpanded}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1 h-5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] shrink-0" />
                    <h3 className={`${heroLabelStyle} drop-shadow-md truncate`}>
                        Trova la tua meta
                    </h3>
                </div>
                <div
                    className="p-1.5 bg-slate-800/50 rounded-full border border-white/10 text-white backdrop-blur-sm shrink-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded();
                    }}
                >
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>

            <HeroCompactTypingField
                text={inspirationText}
                variant="inspiration"
                aria-label="Suggerimento ispirazionale"
            />

            <div className="shrink-0">
                <SearchBar
                    compact
                    value={props.manualCitySearch}
                    onChange={props.setManualCitySearch}
                    isFocused={props.isSearchFocused}
                    onFocus={handleSearchFocus}
                    results={props.searchResults}
                    onSelect={props.handleManualCitySelect}
                    containerRef={props.searchRef}
                />
            </div>
        </div>
    );

    // --- MINIMAL BAR (the other module is open) ---
    const renderMinimalBar = () => (
        <HeroCollapsedBar
            title="Trova la tua meta"
            titleClassName={`${heroLabelStyle} drop-shadow-md`}
            accentClassName="bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            expanded={false}
            onClick={toggleExpanded}
        />
    );

    // --- EXPANDED HEADER (stacked, this module open) ---
    const renderExpandedHeader = () => (
        <HeroCollapsedBar
            title="Trova la tua meta"
            titleClassName={`${heroLabelStyle} drop-shadow-md`}
            accentClassName="bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            expanded
            onClick={toggleExpanded}
            trailing={
                <div className="shrink-0 ml-1" onClick={(e) => e.stopPropagation()}>
                    {renderSummary()}
                </div>
            }
        />
    );

    const renderFilterBody = (stacked: boolean) => (
        <>
            <div className={`flex flex-col ${stacked ? 'px-3 pt-2' : 'p-3 md:px-5 md:py-4'}`}>
                {!stacked && (
                    <div
                        className="flex justify-between items-center shrink-0 cursor-pointer lg:cursor-default h-10 mb-0.5 lg:mb-0"
                        onClick={toggleExpanded}
                    >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)] shrink-0 w-1 h-7" />
                            <h3 className={`${heroLabelStyle} drop-shadow-md truncate`}>
                                Trova la tua meta
                            </h3>
                        </div>

                        <div
                            className="shrink-0 mr-2 lg:mr-0 lg:absolute lg:inset-0 lg:flex lg:items-center lg:justify-center lg:pointer-events-none"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="lg:pointer-events-auto">
                                {renderSummary()}
                            </div>
                        </div>

                        <div
                            className="lg:hidden p-1.5 bg-slate-800/50 rounded-full border border-white/10 text-white backdrop-blur-sm shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded();
                            }}
                        >
                            {props.isFiltersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); props.handleGlobalReset(); }}
                            className="text-slate-400 hover:text-white transition-all hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-slate-800/30 hover:bg-slate-700/50 border border-white/5 hover:border-white/20"
                            title="Resetta filtri"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                <div className={`${stacked ? '' : 'mt-3.5'} ${showFullFilterContent && props.isFiltersExpanded ? 'flex' : showFullFilterContent ? 'hidden lg:flex' : 'hidden'}`}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-3 lg:gap-y-4 w-full">
                        <FilterSelect label="Continente" value={props.continent} options={continents} onChange={props.handleContinentChange} onReset={props.resetContinent} />
                        <FilterSelect label="Nazione" value={props.nation} options={nations} onChange={props.handleNationChange} onReset={props.resetNation} disabled={!props.continent} />
                        <FilterSelect label="Regione" value={props.region} options={regions} onChange={props.handleRegionChange} onReset={props.resetRegion} disabled={!props.nation} />
                        <FilterSelect label="Zona Turistica" value={props.selectedZone} options={props.geoOptions?.zones || []} onChange={props.handleZoneChange} onReset={props.resetZone} disabled={!props.region} />
                        <FilterSelect label="Città" value={props.selectedCity} options={props.filteredCities.map(c => ({ label: c.name, value: c.id }))} onChange={props.handleCityChange} onReset={props.resetCity} disabled={!props.region} />
                        <FilterSelect label="Stagione" value={props.selectedSeason || ''} options={SEASON_OPTIONS} onChange={(e) => props.handleSeasonClick(e.target.value)} onReset={() => props.handleSeasonClick(props.selectedSeason || '')} />
                    </div>
                </div>
            </div>

            <div className={`mt-auto bg-slate-950/60 backdrop-blur-md flex flex-col max-md:gap-2 md:flex-row items-stretch justify-between w-auto max-md:mx-3 lg:mx-6 xl:mx-10 max-md:mb-3 rounded-xl overflow-visible ${
                showFullFilterContent && props.isFiltersExpanded ? 'flex' : showFullFilterContent ? 'hidden lg:flex' : 'hidden'
            }`}>
                {isMobileCompact ? (
                    <>
                        <div className="flex flex-row items-stretch w-full">
                            <div className="flex items-stretch flex-1 min-w-0 border border-slate-700/40 rounded-l-xl overflow-hidden">
                                <div
                                    className="flex items-center justify-center px-1 bg-slate-950/40 border-r border-slate-700/40 group/label cursor-help rounded-tl-xl rounded-bl-xl shrink-0"
                                    title="Categoria territoriale della destinazione"
                                >
                                    <span
                                        className="uppercase tracking-[0.04em] text-[6.5px] font-black text-amber-500/70 group-hover/label:text-amber-500 transition-colors w-full text-center"
                                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                    >
                                        Tipologia
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 grid-rows-2 flex-1 min-w-0">
                                    {TIPOLOGIA_OPTIONS.map((item) => {
                                        const isActive = props.activeCategories.includes(item.val);
                                        return (
                                            <button
                                                key={item.val}
                                                onClick={() => props.handleToggleCategory(item.val)}
                                                className={`flex items-center justify-center py-2.5 transition-all border-r border-b border-slate-700/20 border-t-0
                                                    ${isActive
                                                        ? 'bg-amber-500/10 text-amber-500 shadow-[inset_0_0_10px_rgba(245,158,11,0.05)]'
                                                        : 'hover:bg-slate-800/40 text-slate-500 hover:text-slate-300'}
                                                `}
                                                title={item.label}
                                            >
                                                <item.icon className={`w-3.5 h-3.5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="w-px self-stretch bg-slate-700/30 shrink-0" aria-hidden="true" />

                            <div className="flex items-stretch flex-1 min-w-0 border border-slate-700/40 rounded-r-xl overflow-hidden">
                                <div className="grid grid-cols-3 grid-rows-2 flex-1 min-w-0">
                                    {ISPIRAZIONE_OPTIONS.map((item, idx) => {
                                        const isActive = props.activeCategories.includes(item.val);
                                        return (
                                            <button
                                                key={item.val}
                                                onClick={() => props.handleToggleCategory(item.val)}
                                                className={`flex items-center justify-center py-2.5 transition-all border-r border-b last:border-r-0 border-slate-700/20 border-t-0
                                                    ${idx % 3 === 0 ? 'border-l border-l-slate-700/20' : ''}
                                                    ${isActive
                                                        ? 'bg-indigo-500/10 text-indigo-400 shadow-[inset_0_0_10px_rgba(99,102,241,0.05)]'
                                                        : 'hover:bg-slate-800/40 text-slate-500 hover:text-slate-300'}
                                                `}
                                                title={item.label}
                                            >
                                                <item.icon className={`w-3.5 h-3.5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                            </button>
                                        );
                                    })}
                                </div>
                                <div
                                    className="flex items-center justify-center px-1 bg-slate-950/40 border-l border-slate-700/40 group/label cursor-help rounded-tr-xl rounded-br-xl shrink-0"
                                    title="Stile di viaggio che desideri vivere"
                                >
                                    <span
                                        className="uppercase tracking-[0.04em] text-[6.5px] font-black text-amber-500/70 group-hover/label:text-amber-500 transition-colors w-full text-center"
                                        style={{ writingMode: 'vertical-rl' }}
                                    >
                                        Ispirazione
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center w-full relative group/search">
                            <div className="flex items-center bg-slate-950/40 border border-slate-700/30 rounded-xl h-9 w-full transition-all hover:border-slate-600/50 shadow-inner">
                                <div className="flex-1 min-w-0 h-full">
                                    <SearchBar
                                        variant="minimal"
                                        value={props.manualCitySearch}
                                        onChange={props.setManualCitySearch}
                                        isFocused={props.isSearchFocused}
                                        onFocus={handleSearchFocus}
                                        results={props.searchResults}
                                        onSelect={props.handleManualCitySelect}
                                        containerRef={props.searchRef}
                                        className="h-full flex items-center"
                                    />
                                </div>
                                <div className="w-[1px] h-4 bg-slate-700/60 shrink-0" />
                                <div className="px-2 shrink-0 flex items-center justify-center">
                                    <button
                                        onClick={() => props.handleAiSubmit('Shortlist AI analysis')}
                                        className="flex items-center justify-center p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors tooltip-trigger"
                                        title="Lasciati guidare: l'AI analizza le città selezionate e suggerisce la destinazione più adatta al tuo viaggio in base alle esperienze degli utenti, al periodo scelto ed alle caratteristiche del territorio!"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-stretch shrink-0 lg:w-[120px] xl:w-auto border border-slate-700/40 rounded-l-xl overflow-hidden">
                            <div
                                className="flex items-center justify-center px-1 bg-slate-950/40 border-r border-slate-700/40 group/label cursor-help rounded-tl-xl rounded-bl-xl shrink-0"
                                title="Categoria territoriale della destinazione"
                            >
                                <span
                                    className="uppercase tracking-[0.04em] text-[6.5px] font-black text-amber-500/70 group-hover/label:text-amber-500 transition-colors w-full text-center"
                                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                >
                                    Tipologia
                                </span>
                            </div>
                            <div className="grid grid-cols-3 grid-rows-2 w-[120px] md:w-[150px] lg:w-[120px] xl:w-[180px]">
                                {TIPOLOGIA_OPTIONS.map((item, idx) => (
                                    <button
                                        key={item.val}
                                        onClick={() => props.handleToggleCategory(item.val)}
                                        className={`flex items-center justify-center py-2.5 transition-all border-r border-b border-slate-700/20 ${idx < 3 ? 'border-t-0' : ''}
                                            ${props.activeCategories.includes(item.val)
                                                ? 'bg-amber-500/10 text-amber-500 shadow-[inset_0_0_10px_rgba(245,158,11,0.05)]'
                                                : 'hover:bg-slate-800/40 text-slate-500 hover:text-slate-300'}
                                        `}
                                        title={item.label}
                                    >
                                        <item.icon className={`w-3.5 h-3.5 transition-transform ${props.activeCategories.includes(item.val) ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center min-w-0 flex-1 relative group/search px-1 mx-1 lg:mx-1 xl:mx-2 lg:w-[260px] xl:flex-1">
                            <div className="flex items-center bg-slate-950/40 border border-slate-700/30 rounded-xl h-9 md:h-10 w-full transition-all hover:border-slate-600/50 shadow-inner">
                                <div className="flex-1 min-w-0 h-full">
                                    <SearchBar
                                        variant="minimal"
                                        value={props.manualCitySearch}
                                        onChange={props.setManualCitySearch}
                                        isFocused={props.isSearchFocused}
                                        onFocus={isStackedLayout ? handleSearchFocus : props.setIsSearchFocused}
                                        results={props.searchResults}
                                        onSelect={props.handleManualCitySelect}
                                        containerRef={props.searchRef}
                                        className="h-full flex items-center"
                                    />
                                </div>
                                <div className="w-[1px] h-4 bg-slate-700/60 shrink-0" />
                                <div className="px-2 shrink-0 flex items-center justify-center">
                                    <button
                                        onClick={() => props.handleAiSubmit('Shortlist AI analysis')}
                                        className="flex items-center justify-center p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors tooltip-trigger"
                                        title="Lasciati guidare: l'AI analizza le città selezionate e suggerisce la destinazione più adatta al tuo viaggio in base alle esperienze degli utenti, al periodo scelto ed alle caratteristiche del territorio!"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-stretch shrink-0 lg:w-[120px] xl:w-auto border border-slate-700/40 rounded-r-xl overflow-hidden">
                            <div className="grid grid-cols-3 grid-rows-2 w-[120px] md:w-[150px] lg:w-[120px] xl:w-[180px]">
                                {ISPIRAZIONE_OPTIONS.map((item, idx) => (
                                    <button
                                        key={item.val}
                                        onClick={() => props.handleToggleCategory(item.val)}
                                        className={`flex items-center justify-center py-2.5 transition-all border-r border-b last:border-r-0 border-slate-700/20 ${idx < 3 ? 'border-t-0' : ''}
                                            ${idx % 3 === 0 ? 'border-l border-l-slate-700/20' : ''}
                                            ${props.activeCategories.includes(item.val)
                                                ? 'bg-indigo-500/10 text-indigo-400 shadow-[inset_0_0_10px_rgba(99,102,241,0.05)]'
                                                : 'hover:bg-slate-800/40 text-slate-500 hover:text-slate-300'}
                                        `}
                                        title={item.label}
                                    >
                                        <item.icon className={`w-3.5 h-3.5 transition-transform ${props.activeCategories.includes(item.val) ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    </button>
                                ))}
                            </div>
                            <div
                                className="flex items-center justify-center px-1 bg-slate-950/40 border-l border-slate-700/40 group/label cursor-help rounded-tr-xl rounded-br-xl shrink-0"
                                title="Stile di viaggio che desideri vivere"
                            >
                                <span
                                    className="uppercase tracking-[0.04em] text-[6.5px] font-black text-amber-500/70 group-hover/label:text-amber-500 transition-colors w-full text-center"
                                    style={{ writingMode: 'vertical-rl' }}
                                >
                                    Ispirazione
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );

    const renderStacked = () => {
        if (stackedMode === 'minimal') return renderMinimalBar();
        if (stackedMode === 'compact') return renderCompactTwin();
        return (
            <>
                {renderExpandedHeader()}
                <HeroExpandableSection expanded={props.isFiltersExpanded}>
                    {renderFilterBody(true)}
                </HeroExpandableSection>
            </>
        );
    };

    return (
        <div
            id="tour-search-section"
            className={`min-w-0 relative group shadow-2xl flex flex-col bg-slate-900 border border-slate-800 rounded-2xl transition-all duration-300 ease-in-out overflow-visible ${
                showCitySearchPopover ? 'max-lg:z-home-hero-popover' : ''
            } ${
                isStackedLayout
                    ? 'h-auto'
                    : !props.isFiltersExpanded
                        ? 'h-auto'
                        : 'lg:h-full'
            }`}
            data-focus-surface="dimmed-background"
        >
            {props.heroImage && (
                <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
                    <ImageWithFallback
                        src={props.heroImage}
                        alt="Hero"
                        className="w-full h-full object-cover opacity-60 grayscale-[30%] group-hover:grayscale-[10%] transition-all duration-1000"
                        priority={true}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-transparent" />
                </div>
            )}

            <div className={`relative z-home-hero-surface flex flex-col rounded-2xl min-h-0 ${isStackedLayout ? 'h-auto' : 'h-full'}`}>
                {isStackedLayout ? renderStacked() : renderFilterBody(false)}
            </div>
        </div>
    );
};
