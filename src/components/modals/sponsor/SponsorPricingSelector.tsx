import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Servizi, Tipi e Componenti UI
import { getPricingVersions, FormattedPricingVersion } from '../../../services/dataService';
import SponsorPlanCard from '../../marketing/SponsorPlanCard';
import { MarketingTierConfig } from '@/types';

// Tipi Locali
type SponsorableType = 'activity' | 'shop' | 'tour_operator' | 'guide';

interface SponsorPricingSelectorProps {
    onSelectionChange: (pricingVersionId: string | null) => void;
    activeType: SponsorableType;
}

// Funzioni Helper
const getRelevantPlanTypes = (type: SponsorableType): string[] => {
    switch (type) {
        case 'activity':
            return ['LOCAL_ACTIVITY', 'REGIONAL_ACTIVITY'];
        case 'shop':
            return ['DIGITAL_SHOWCASE'];
        case 'guide':
            return ['TOUR_GUIDE'];
        case 'tour_operator':
            return ['TOUR_OPERATOR'];
        default:
            return [];
    }
};

const getPlanFeatures = (planType: string): string[] => {
    switch (planType) {
        case 'LOCAL_ACTIVITY':
            return [
                "Visibilità nella tua città",
                "Badge Partner Silver",
                "Incluso nei risultati di ricerca",
                "Pagina dedicata base",
            ];
        case 'REGIONAL_ACTIVITY':
            return [
                "Visibilità in tutta la regione",
                "Badge Partner Gold",
                "Posizionamento prioritario",
                "Pagina dedicata avanzata",
            ];
        case 'DIGITAL_SHOWCASE':
            return [
                "Vetrina digitale nel nostro shop",
                "Badge Bottega Verificata",
                "Promozione sui canali social",
                "Pagina shop personalizzata",
            ];
        case 'TOUR_GUIDE':
             return [
                "Visibilità come Guida Certificata",
                "Badge Guida Professionista",
                "Proponi i tuoi tour sulla piattaforma",
                "Pagina profilo personale",
            ];
        case 'TOUR_OPERATOR':
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
        return months > 1 ? `${months} Mesi` : 'Mese';
    }
    return `${days} Giorni`;
};

// Componente Principale
export const SponsorPricingSelector: React.FC<SponsorPricingSelectorProps> = ({ onSelectionChange, activeType }) => {
    const [pricingVersions, setPricingVersions] = useState<FormattedPricingVersion[]>([]);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadAndProcessPricings = async () => {
            try {
                setIsLoading(true);
                setSelectedVersionId(null);
                onSelectionChange(null);

                const versions = await getPricingVersions();
                const relevantPlanTypes = getRelevantPlanTypes(activeType);
                const filteredVersions = versions
                    .filter(v => relevantPlanTypes.includes(v.plan_type))
                    .sort((a, b) => a.price - b.price); // Ordina per prezzo crescente

                setPricingVersions(filteredVersions);
                setError(null);
            } catch (e) {
                setError("Impossibile caricare i piani di sponsorizzazione.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        loadAndProcessPricings();
    }, [activeType, onSelectionChange]);

    const handlePlanSelect = (pricingVersionId: string) => {
        setSelectedVersionId(pricingVersionId);
        onSelectionChange(pricingVersionId);
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

    const renderPlanCard = (version: FormattedPricingVersion) => {
        const isSelected = selectedVersionId === version.pricing_version_id;
        
        const cardConfig: MarketingTierConfig = {
            basePrice: version.price,
            promoPrice: undefined,
            promoActive: false,
            customFeatureLabels: getPlanFeatures(version.plan_type),
        };

        return (
             <SponsorPlanCard
                key={version.pricing_version_id}
                planKey={version.plan_name}
                planType={version.plan_type}
                config={cardConfig}
                isSelected={isSelected}
                onSelect={() => handlePlanSelect(version.pricing_version_id)}
            />
        );
    };

    return (
        <div className="w-full space-y-8">
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch`}>
                {pricingVersions.map(renderPlanCard)}
            </div>

            {selectedVersion && (
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex items-center justify-between animate-in fade-in duration-300">
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