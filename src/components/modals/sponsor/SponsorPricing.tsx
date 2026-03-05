
import React from 'react';
import { MarketingConfig } from '../../../types/models/Sponsor';
import { SponsorPlanCard } from '../../marketing/SponsorPlanCard';

interface SponsorPricingProps {
    activeType: 'activity' | 'shop' | 'tour_operator' | 'guide';
    marketingConfig: MarketingConfig;
    selectedPlan: string;
    onSelectPlan: (plan: 'silver' | 'gold' | 'guide_pro' | 'shop_basic' | 'agency_pro') => void;
}

export const SponsorPricing = ({ activeType, marketingConfig, selectedPlan, onSelectPlan }: SponsorPricingProps) => {
    if (activeType === 'activity') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <SponsorPlanCard type="silver" config={marketingConfig.silver} selected={selectedPlan === 'silver'} onClick={() => onSelectPlan('silver')} />
                <SponsorPlanCard type="gold" config={marketingConfig.gold} selected={selectedPlan === 'gold'} onClick={() => onSelectPlan('gold')} />
            </div>
        );
    }

    if (activeType === 'shop') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-10 max-w-sm mx-auto">
                <SponsorPlanCard type="shop" config={marketingConfig.shop} selected={true} />
            </div>
        );
    }

    if (activeType === 'guide') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-10 max-w-sm mx-auto">
                <SponsorPlanCard type="guide" config={marketingConfig.guide} selected={true} />
            </div>
        );
    }

    if (activeType === 'tour_operator') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-10 max-w-sm mx-auto">
                <SponsorPlanCard type="tourOperator" config={marketingConfig.tourOperator || { basePrice: 150, promoActive: false }} selected={true} />
            </div>
        );
    }

    return null;
};
