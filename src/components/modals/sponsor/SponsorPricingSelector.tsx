import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Servizi, Tipi e Componenti UI
import { PLAN_TYPES } from '@/constants/planTypes';
import { getPricingVersions, FormattedPricingVersion } from '../../../services/dataService';
import SponsorPlanCard from '../../marketing/SponsorPlanCard';
import { MarketingTierConfig } from '@/types';

// Tipi Locali - Utilizziamo i PlanType canonici come "Group Keys"
type SponsorableGroup = typeof PLAN_TYPES.LOCAL_ACTIVITY | typeof PLAN_TYPES.DIGITAL_SHOWCASE | typeof PLAN_TYPES.TOUR_GUIDE | typeof PLAN_TYPES.TOUR_OPERATOR;

interface SponsorPricingSelectorProps {
    onSelectionChange: (pricingVersionId: string | null) => void;
    activeGroup: SponsorableGroup;
    initialPlanType?: string; // Es: PLAN_TYPES.REGIONAL_ACTIVITY (Gold)
    campaignCode?: string;
}

// Funzioni Helper
const getRelevantPlanTypes = (group: SponsorableGroup): string[] => {
    switch (group) {
        case PLAN_TYPES.LOCAL_ACTIVITY:
            return [PLAN_TYPES.LOCAL_ACTIVITY, PLAN_TYPES.REGIONAL_ACTIVITY];
        case PLAN_TYPES.DIGITAL_SHOWCASE:
            return [PLAN_TYPES.DIGITAL_SHOWCASE];
        case PLAN_TYPES.TOUR_GUIDE:
            return [PLAN_TYPES.TOUR_GUIDE];
        case PLAN_TYPES.TOUR_OPERATOR:
            return [PLAN_TYPES.TOUR_OPERATOR];
        default:
            return [];
    }
};

const getPlanFeatures = (planType: string): string[] => {
    switch (planType) {
        case PLAN_TYPES.LOCAL_ACTIVITY:
            return [
                "Visibilità nella tua città",
                "Badge Partner Silver",
                "Incluso nei risultati di ricerca",
                "Pagina dedicata base",
            ];
        case PLAN_TYPES.REGIONAL_ACTIVITY:
            return [
                "Visibilità in tutta la regione",
                "Badge Partner Gold",
                "Posizionamento prioritario",
                "Pagina dedicata avanzata",
            ];
        case PLAN_TYPES.DIGITAL_SHOWCASE:
            return [
                "Vetrina digitale nel nostro shop",
                "Badge Bottega Verificata",
                "Promozione sui canali social",
                "Pagina shop personalizzata",
            ];
        case PLAN_TYPES.TOUR_GUIDE:
             return [
                "Visibilità come Guida Certificata",
                "Badge Guida Professionista",
                "Proponi i tuoi tour sulla piattaforma",
                "Pagina profilo personale",
            ];
        case PLAN_TYPES.TOUR_OPERATOR:
             return [
                "Visibilità come Tour Operator",
                "Badge Partner Ufficiale",
                "Inclusione nel pianificatore di viaggi AI",
                "Pagina dedicata con i tuoi pacchetti",
            ];
        default:
             return ["Piano di sponsorizzazione standard"];
    }
};

const formatDuration = (days: number): string => {
    if (days >= 365) {
        const years = days / 365;
        return years > 1 ? `${years} Anni` : 'Annuale';
    }
    if (days >= 30) {
        const months = Math.round(days / 30);
        return months > 1 ? `${months} Mesi` : 'Mensile';
    }
    return `${days} Giorni`;
};

// Componente Principale
export const SponsorPricingSelector: React.FC<SponsorPricingSelectorProps> = ({ onSelectionChange, activeGroup, initialPlanType, campaignCode }) => {
    const [pricingVersions, setPricingVersions] = useState<FormattedPricingVersion[]>([]);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Grouping state per duration selection all'interno del plan
    const [selectedDurations, setSelectedDurations] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadAndProcessPricings = async () => {
            try {
                setIsLoading(true);
                setSelectedVersionId(null);
                // Non resettiamo onSelectionChange immediatamente se abbiamo un initialPlanType previsto

                const versions = await getPricingVersions(campaignCode);
                const relevantPlanTypes = getRelevantPlanTypes(activeGroup);
                const filteredVersions = versions
                    .filter(v => relevantPlanTypes.includes(v.plan_type))
                    .sort((a, b) => a.price - b.price);

                setPricingVersions(filteredVersions);
                
                // Initialize default durations (shortest duration for each plan_type)
                const defaultDurations: Record<string, string> = {};
                filteredVersions.forEach(v => {
                    const existing = defaultDurations[v.plan_type];
                    if (!existing || v.duration_days < filteredVersions.find(f => f.pricing_version_id === existing)!.duration_days) {
                         defaultDurations[v.plan_type] = v.pricing_version_id;
                    }
                });
                setSelectedDurations(defaultDurations);

                // AUTO-SELEZIONE INITIAL PLAN
                if (initialPlanType && defaultDurations[initialPlanType]) {
                    const targetId = defaultDurations[initialPlanType];
                    setSelectedVersionId(targetId);
                    onSelectionChange(targetId);
                } else if (filteredVersions.length > 0) {
                    // Fallback sulla prima opzione disponibile (durata minima) se nessun preference
                    const firstType = relevantPlanTypes.find(t => defaultDurations[t]) || filteredVersions[0].plan_type;
                    const targetId = defaultDurations[firstType];
                    setSelectedVersionId(targetId);
                    onSelectionChange(targetId);
                }

                setError(null);
            } catch (e) {
                setError("Impossibile caricare i piani di sponsorizzazione.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        loadAndProcessPricings();
    }, [activeGroup, initialPlanType, onSelectionChange, campaignCode]);

    const handlePlanSelect = (pricingVersionId: string) => {
        setSelectedVersionId(pricingVersionId);
        onSelectionChange(pricingVersionId);
    };
    
    const handleDurationChange = (planType: string, versionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDurations(prev => ({ ...prev, [planType]: versionId }));
        if (selectedVersionId && pricingVersions.find(v => v.pricing_version_id === selectedVersionId)?.plan_type === planType) {
             handlePlanSelect(versionId);
        }
    };
    
    const selectedVersion = pricingVersions.find(v => v.pricing_version_id === selectedVersionId) || null;

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[200px] text-slate-400 gap-3"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /> <span className="text-sm font-bold">Caricamento piani...</span></div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg">{error}</div>;
    }
    
    if (pricingVersions.length === 0) {
        return (
            <div className="text-center py-10 text-amber-400 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                <p>Nessun piano di sponsorizzazione disponibile per questa categoria.</p>
                <p className="text-xs text-slate-400 mt-2">Contatta l'amministrazione per maggiori dettagli.</p>
            </div>
        );
    }
    
    // Raggruppa i pricingVersions per Plan Type
    const groupedPlans = pricingVersions.reduce((acc, current) => {
        if (!acc[current.plan_type]) {
            acc[current.plan_type] = [];
        }
        acc[current.plan_type].push(current);
        // sort in-place per avere durata crescente all'interno del gruppo
        acc[current.plan_type].sort((a,b) => a.duration_days - b.duration_days);
        return acc;
    }, {} as Record<string, FormattedPricingVersion[]>);

    const renderPlanGroup = (planType: string) => {
        const versions = groupedPlans[planType];
        if (!versions || versions.length === 0) return null;
        
        const activeVersionId = selectedDurations[planType] || versions[0].pricing_version_id;
        const activeVersion = versions.find(v => v.pricing_version_id === activeVersionId)!;
        const isSelected = selectedVersionId === activeVersionId;
        
        const cardConfig: MarketingTierConfig = {
            basePrice: activeVersion.price,
            promoPrice: undefined,
            promoActive: false,
            customFeatureLabels: getPlanFeatures(planType),
        };

        return (
            <div key={planType} className="flex flex-col gap-3 relative">
                {/* Il card component cliccabile */}
                 <SponsorPlanCard
                    planKey={activeVersion.plan_name}
                    planType={planType}
                    config={cardConfig}
                    isSelected={isSelected}
                    onSelect={() => handlePlanSelect(activeVersionId)}
                    durationLabel={`/${formatDuration(activeVersion.duration_days)}`}
                />
                
                {/* Selettore durata multi-options */}
                {versions.length > 1 && (
                    <div className="mt-2 flex gap-2 justify-center absolute -bottom-12 left-0 right-0 z-floating-panel w-full px-4">
                        <div className="flex bg-slate-800 rounded-full p-1 border border-slate-700 shadow-md">
                            {versions.map(v => (
                                <button
                                    key={v.pricing_version_id}
                                    type="button"
                                    onClick={(e) => handleDurationChange(planType, v.pricing_version_id, e)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                                        activeVersionId === v.pricing_version_id
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                    }`}
                                >
                                    {formatDuration(v.duration_days)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full space-y-12">
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-16 items-stretch`}>
                {Object.keys(groupedPlans).map(renderPlanGroup)}
            </div>

            {selectedVersion && (
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex items-center justify-between animate-in fade-in duration-300 mt-12">
                    <h4 className="font-bold text-white">Riepilogo:</h4>
                    <div className="text-right">
                       <span className="font-mono text-lg text-emerald-400 bg-emerald-900/50 px-3 py-1 rounded">
                            {selectedVersion.plan_name} - {formatDuration(selectedVersion.duration_days)}
                        </span>
                        <div className="flex items-baseline gap-2 justify-end mt-2">
                            <span className="text-slate-400 font-bold">Prezzo:</span>
                            <span className="text-2xl font-bold text-white">{selectedVersion.price} {selectedVersion.currency}</span>
                            <span className="text-slate-500 text-sm font-medium">+ IVA</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
