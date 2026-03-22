import React from 'react';
import { useConfig } from '../@/context/ConfigContext';
import { MarketingConfig } from '@/types';
import SponsorPlanCard from '../../marketing/SponsorPlanCard';

interface SponsorPricingProps {
    onPlanSelect: (planKey: string) => void;
    activeType: 'activity' | 'shop' | 'tour_operator' | 'guide';
    selectedPlan: string | null;
}

const SponsorPricing: React.FC<SponsorPricingProps> = ({ onPlanSelect, activeType, selectedPlan }) => {
    const { configs, isLoading } = useConfig();
    const marketingConfig = configs.marketing_prices_v2 as MarketingConfig;

    const getPlansForType = (type: string): (keyof MarketingConfig)[] => {
        switch (type) {
            case 'activity':
                return ['silver', 'gold'];
            case 'shop':
                return ['shop'];
            case 'tour_operator':
                return ['tourOperator'];
            case 'guide':
                return ['guide'];
            default:
                return [];
        }
    };

    const plansToShow = getPlansForType(activeType);

    if (isLoading) {
        return <div className="text-center py-10">Caricamento dei piani...</div>;
    }

    if (!marketingConfig) {
        return <div className="text-center py-10 text-red-500">Errore: Impossibile caricare le configurazioni di prezzo.</div>;
    }

    return (
        <div className="w-full">
            <h3 className="text-2xl font-bold text-center text-amber-400 mb-8">Scegli il Piano Adatto a Te</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {plansToShow.map(planKey => {
                    const planConfig = marketingConfig[planKey];
                    if (typeof planConfig !== 'object' || !('basePrice' in planConfig)) return null;

                    return (
                        <SponsorPlanCard
                            key={planKey}
                            planKey={planKey as string}
                            config={planConfig}
                            isRecommended={planKey === 'gold'}
                            selected={selectedPlan === planKey}
                            onSelect={() => onPlanSelect(planKey as string)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default SponsorPricing;
