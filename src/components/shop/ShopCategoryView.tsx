import { Loader2 } from 'lucide-react';
import type React from 'react';
import type { PointOfInterest, ShopPartner } from '../../types/index';
import { ShopCard } from './ShopCard';
import { ShopPartnerColumn } from './ShopPartnerColumn';

interface ShopCategoryViewProps {
  isLoading: boolean;
  shopsList: ShopPartner[];
  goldSponsors: PointOfInterest[];
  silverSponsors: PointOfInterest[];
  onSelectShop: (shop: ShopPartner) => void;
  onAddToItinerary: (poi: PointOfInterest) => void;
  onOpenPoiDetail: (poi: PointOfInterest) => void;
  onOpenSponsor: (type?: string) => void;
}

/**
 * Layout PO fisso:
 * - mobile/tablet: LISTA
 * - desktop (lg+): PARTNER | LISTA | PARTNER
 * Nessuna quinta colonna su schermi larghi.
 * Scroll: gestito dal contenitore padre in ShopPage (niente nested overflow-y).
 */
export const ShopCategoryView: React.FC<ShopCategoryViewProps> = ({
  isLoading,
  shopsList,
  goldSponsors,
  silverSponsors,
  onSelectShop,
  onAddToItinerary,
  onOpenPoiDetail,
  onOpenSponsor,
}) => {
  return (
    <div className="md:px-10 w-full min-h-0 animate-in slide-in-from-right-10 duration-500 bg-[#020617] grid grid-cols-1 lg:grid-cols-[19rem_minmax(0,1fr)_19rem] gap-0">
      <div className="hidden lg:block w-[19rem] shrink-0 self-stretch min-h-[28rem] overflow-hidden border-r border-slate-800/50">
        <ShopPartnerColumn
          side="left"
          offsetMultiplier={0}
          goldSponsors={goldSponsors}
          silverSponsors={silverSponsors}
          onAddToItinerary={onAddToItinerary}
          onOpenPoiDetail={onOpenPoiDetail}
          onOpenSponsor={onOpenSponsor}
        />
      </div>

      <div className="min-w-0 w-full pr-2 pb-10">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
              Ricerca botteghe in corso...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto pt-4 px-4">
            {shopsList.map((shop, idx) => (
              <ShopCard key={shop.id || `shop-${idx}`} shop={shop} onOpen={onSelectShop} />
            ))}
            {shopsList.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-[3rem] text-slate-500 italic">
                Nessuna bottega trovata in questa categoria.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="hidden lg:block w-[19rem] shrink-0 self-stretch min-h-[28rem] overflow-hidden border-l border-slate-800/50">
        <ShopPartnerColumn
          side="right"
          offsetMultiplier={1}
          goldSponsors={goldSponsors}
          silverSponsors={silverSponsors}
          onAddToItinerary={onAddToItinerary}
          onOpenPoiDetail={onOpenPoiDetail}
          onOpenSponsor={onOpenSponsor}
        />
      </div>
    </div>
  );
};
