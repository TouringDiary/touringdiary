import React from 'react';
import { MarketingTierConfig } from '../../types';

interface SponsorPlanCardProps {
    planKey: string;
    planType?: string; // <-- PROP OPZIONALE
    config: MarketingTierConfig;
    isRecommended?: boolean;
    isSelected?: boolean;
    onSelect: () => void;
}

// Oggetto mappa per i colori dei bordi
const tierBorderColors: { [key: string]: string } = {
    REGIONAL_ACTIVITY: 'bg-amber-400',      // Gold
    LOCAL_ACTIVITY:    'bg-slate-300',      // Silver
    DIGITAL_SHOWCASE:  'bg-cyan-400',
    TOUR_GUIDE:        'bg-lime-500',
    TOUR_OPERATOR:     'bg-violet-500',
};

const SponsorPlanCard: React.FC<SponsorPlanCardProps> = ({ planKey, planType, config, isRecommended, isSelected, onSelect }) => {
    const { basePrice, promoPrice, promoLabel, promoActive, customFeatureLabels } = config;

    const hasPromo = promoActive && promoPrice !== null && promoPrice < basePrice;

    const formatPlanName = (key: string): string => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    };

    const borderColorClass = planType ? tierBorderColors[planType] || 'bg-slate-600' : 'bg-transparent';

    // Rimossa la classe `p-6`, aggiunta `overflow-hidden`
    const cardClass = `border-2 rounded-lg flex flex-col h-full transition-all duration-300 overflow-hidden ${isSelected ? 'border-amber-500 bg-gray-800 scale-105' : 'border-gray-700 bg-gray-800/50 hover:border-amber-400'}`;
    const buttonClass = `w-full mt-auto font-bold py-3 px-4 rounded-md transition-all duration-200 ${isSelected ? 'bg-green-600 text-white' : isRecommended ? 'bg-amber-500 hover:bg-amber-600 text-black transform hover:scale-105' : 'bg-gray-700 hover:bg-amber-500 hover:text-black'}`;

    return (
        <div className={cardClass}>
            {/* Bordo colorato condizionale */}
            <div className={`h-2 ${borderColorClass}`} />

            {/* Contenuto wrappato per gestire il padding */}
            <div className="p-6 flex flex-col flex-grow">
                {isRecommended && !isSelected && (
                    <div className="text-center mb-4">
                        <span className="bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Consigliato</span>
                    </div>
                )}
                <h3 className="text-2xl font-bold text-center mb-2 text-white">{formatPlanName(planKey)}</h3>
                
                <div className="text-center mb-6">
                    {hasPromo ? (
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-bold text-amber-400">{promoPrice}€</span>
                            <span className="text-gray-400 line-through text-lg">{basePrice}€</span>
                            {promoLabel && <span className="text-green-400 text-sm font-semibold mt-1">{promoLabel}</span>}
                        </div>
                    ) : (
                        <span className="text-4xl font-bold text-white">{basePrice}€</span>
                    )}
                    <p className="text-gray-500 text-sm mt-1">/mese</p>
                </div>

                <div className="flex-grow mb-6">
                    <ul className="space-y-3 text-gray-300">
                        {customFeatureLabels && customFeatureLabels.map((feature, index) => (
                            <li key={index} className="flex items-center">
                                <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <button onClick={onSelect} className={buttonClass}>
                    {isSelected ? "✓ SELEZIONATO" : "Seleziona Piano"}
                </button>
            </div>
        </div>
    );
};

export default SponsorPlanCard;
