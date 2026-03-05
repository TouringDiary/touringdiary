
import React, { useState } from 'react';
import { DollarSign, Plus, User, Store } from 'lucide-react';
import { MarketingConfig, TierPricingConfig } from '../../../types/index';
import { SponsorPlanCard } from '../../marketing/SponsorPlanCard';

interface PriceConfiguratorProps {
    prices: MarketingConfig;
    promoTypes: { id: string, label: string }[];
    onUpdate: (key: keyof MarketingConfig, config: TierPricingConfig) => void;
    onOpenPromoModal: () => void;
}

export const PriceConfigurator = ({ prices, promoTypes, onUpdate, onOpenPromoModal }: PriceConfiguratorProps) => {
    const [viewMode, setViewMode] = useState<'b2b' | 'b2c'>('b2b');

    return (
        <div>
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-800 pb-4">
                 <div>
                     <h3 className="text-xl font-bold text-white flex items-center gap-2">
                         <DollarSign className="w-6 h-6 text-emerald-500"/> Listini & Promozioni Attive
                     </h3>
                     <p className="text-xs text-slate-400 mt-1">Configura prezzi e feature per ogni livello.</p>
                 </div>
                 
                 <div className="flex gap-2">
                     <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                         <button 
                            onClick={() => setViewMode('b2b')}
                            className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-2 ${viewMode === 'b2b' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            <Store className="w-3.5 h-3.5"/> Business
                        </button>
                        <button 
                            onClick={() => setViewMode('b2c')}
                            className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-2 ${viewMode === 'b2c' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            <User className="w-3.5 h-3.5"/> Viaggiatori
                        </button>
                     </div>
                     <button onClick={onOpenPromoModal} className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold border border-slate-700 flex items-center gap-2 transition-colors">
                         <Plus className="w-3.5 h-3.5"/> Etichetta Promo
                     </button>
                 </div>
             </div>
             
             {viewMode === 'b2b' ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in">
                     {/* BUSINESS PLANS */}
                     <SponsorPlanCard type="silver" config={prices.silver} isEditable={true} onUpdateConfig={(c) => onUpdate('silver', c)} promoTypes={promoTypes} />
                     <SponsorPlanCard type="gold" config={prices.gold} isEditable={true} onUpdateConfig={(c) => onUpdate('gold', c)} promoTypes={promoTypes} />
                     <SponsorPlanCard type="shop" config={prices.shop} isEditable={true} onUpdateConfig={(c) => onUpdate('shop', c)} promoTypes={promoTypes} />
                     <SponsorPlanCard type="tourOperator" config={prices.tourOperator || { basePrice: 150, promoActive: false }} isEditable={true} onUpdateConfig={(c) => onUpdate('tourOperator', c)} promoTypes={promoTypes} />
                     <SponsorPlanCard type="guide" config={prices.guide} isEditable={true} onUpdateConfig={(c) => onUpdate('guide', c)} promoTypes={promoTypes} />
                 </div>
             ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in">
                     {/* USER PLANS */}
                     <SponsorPlanCard 
                        type="premiumUser" 
                        config={prices.premiumUser || { basePrice: 4.99, promoActive: false }} 
                        isEditable={true} 
                        onUpdateConfig={(c) => onUpdate('premiumUser', c)} 
                        promoTypes={promoTypes} 
                    />
                     <SponsorPlanCard 
                        type="premiumUserPlus" 
                        config={prices.premiumUserPlus || { basePrice: 9.99, promoActive: false }} 
                        isEditable={true} 
                        onUpdateConfig={(c) => onUpdate('premiumUserPlus', c)} 
                        promoTypes={promoTypes} 
                    />
                     
                     <div className="flex flex-col justify-center items-center text-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                         <p className="text-slate-500 text-sm font-medium italic">Il piano "Free" non è configurabile qui. <br/>È attivo di default per tutti i registrati.</p>
                     </div>
                 </div>
             )}
        </div>
    );
};
