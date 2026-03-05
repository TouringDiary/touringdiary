
import React from 'react';
import { Loader2 } from 'lucide-react';
import { ShopPartner, PointOfInterest } from '../../types/index';
import { ShopCard } from './ShopCard';
import { ShopSponsorColumn } from './ShopSponsorColumn';

interface ShopCategoryViewProps {
    isLoading: boolean;
    shopsList: ShopPartner[];
    goldSponsors: PointOfInterest[];
    silverSponsors: PointOfInterest[];
    onSelectShop: (shop: ShopPartner) => void;
    onAddToItinerary: (poi: PointOfInterest) => void;
    onOpenSponsor: (type?: string) => void;
}

export const ShopCategoryView: React.FC<ShopCategoryViewProps> = ({
    isLoading,
    shopsList,
    goldSponsors,
    silverSponsors,
    onSelectShop,
    onAddToItinerary,
    onOpenSponsor
}) => {
    return (
        <div className="md:px-10 flex-1 flex h-full animate-in slide-in-from-right-10 duration-500 bg-[#020617] grid grid-cols-1 lg:grid-cols-[19rem_1fr_19rem] min-[1900px]:grid-cols-[19rem_19rem_1fr_19rem_19rem] gap-0">
            
            {/* SINISTRA: OUTER SPONSOR (SOLO WIDE) */}
            <div className="hidden min-[1900px]:block h-full overflow-hidden border-r border-slate-800/50">
                <ShopSponsorColumn 
                    side="left" 
                    offsetMultiplier={0}
                    goldSponsors={goldSponsors} 
                    silverSponsors={silverSponsors} 
                    onAddToItinerary={onAddToItinerary} 
                    onOpenSponsor={onOpenSponsor} 
                />
            </div>

            {/* SINISTRA: INNER SPONSOR */}
            <div className="hidden lg:block h-full overflow-hidden border-r border-slate-800/50">
                <ShopSponsorColumn 
                    side="left" 
                    offsetMultiplier={1}
                    goldSponsors={goldSponsors} 
                    silverSponsors={silverSponsors} 
                    onAddToItinerary={onAddToItinerary} 
                    onOpenSponsor={onOpenSponsor} 
                />
            </div>

            {/* CENTRO: GRIGLIA NEGOZI - Aggiunto scrollbar-hide-mobile */}
            <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-hide-mobile pr-2 pb-10">
                {isLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin"/>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Ricerca botteghe in corso...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto pt-4 px-4">
                        {shopsList.map((shop, idx) => (
                            <ShopCard key={shop.id || `shop-${idx}`} shop={shop} onOpen={onSelectShop}/>
                        ))}
                        {shopsList.length === 0 && (
                            <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-[3rem] text-slate-500 italic">
                                Nessuna bottega trovata in questa categoria.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* DESTRA: INNER SPONSOR */}
            <div className="hidden lg:block h-full overflow-hidden border-l border-slate-800/50">
                <ShopSponsorColumn 
                    side="right" 
                    offsetMultiplier={2}
                    goldSponsors={goldSponsors} 
                    silverSponsors={silverSponsors} 
                    onAddToItinerary={onAddToItinerary} 
                    onOpenSponsor={onOpenSponsor} 
                />
            </div>

            {/* DESTRA: OUTER SPONSOR (SOLO WIDE) */}
            <div className="hidden min-[1900px]:block h-full overflow-hidden border-l border-slate-800/50">
                <ShopSponsorColumn 
                    side="right" 
                    offsetMultiplier={3}
                    goldSponsors={goldSponsors} 
                    silverSponsors={silverSponsors} 
                    onAddToItinerary={onAddToItinerary} 
                    onOpenSponsor={onOpenSponsor} 
                />
            </div>
        </div>
    );
};