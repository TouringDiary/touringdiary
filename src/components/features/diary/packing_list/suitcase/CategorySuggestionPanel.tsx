import React, { useMemo, useState } from 'react';
import { ShoppingBag, ExternalLink, ChevronRight, ChevronLeft, Search, Package, ArrowRight } from 'lucide-react';
import { useAutoRotateSuggestions } from '@/hooks/useAutoRotateSuggestions';
import { normalizeItemName } from '@/utils/tagDerivation';
import { useConfig } from '@/context/ConfigContext';
import { SETTINGS_KEYS } from '@/services/settingsService';
import { ResolvedAffiliateProduct } from '@/types/suitcase';
import { ItemCategoryIcon, resolveAffiliateProductImage, resolveAffiliatePartnerDisplay } from './SuitcaseUtils';
import { affiliateTrackingService } from '@/services/affiliateTrackingService';

interface CategorySuggestionPanelProps {
  category: string;
  selectedItem: {
    name: string;
    category: string;
    tags: string[];
  } | null;
  itemMap: Record<string, ResolvedAffiliateProduct[]>;
  categoryMap: Record<string, ResolvedAffiliateProduct[]>;
  overrides?: Record<string, ResolvedAffiliateProduct>;
  globalMap: ResolvedAffiliateProduct[];
  placeholders?: Record<string, ResolvedAffiliateProduct[]>;
  onLinkBuild: (provider: string, url: string) => string;
  onLinkBuildSearch: (query: string, category?: string) => string;
}

export const CategorySuggestionPanel: React.FC<CategorySuggestionPanelProps> = ({
  category,
  selectedItem,
  itemMap,
  categoryMap,
  overrides = {},
  globalMap,
  placeholders = {},
  onLinkBuild,
  onLinkBuildSearch
}) => {
  const [isHoveringPanel, setIsHoveringPanel] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const { configs } = useConfig();

  const suitcasePlaceholders = useMemo(() =>
    configs?.[SETTINGS_KEYS.SUITCASE_PLACEHOLDERS] || {},
    [configs]
  );

  // Filter global products to ensure we only show active ones
  const activeGlobalProducts = useMemo(() =>
    (globalMap || []).filter(p => p.is_active === true),
    [globalMap]
  );

  // Resolve which product to show
  const productToShow = useMemo(() => {
    if (!selectedItem) return null;

    // 1. Try administrative override
    const normalizedName = normalizeItemName(selectedItem.name);
    if (overrides[normalizedName]) return overrides[normalizedName];

    // 2. Try manual mapping BY NAME
    const lowerName = selectedItem.name.toLowerCase();
    if (itemMap[lowerName] && itemMap[lowerName].length > 0) return itemMap[lowerName][0];

    // 3. Try item mapping by tags
    if (selectedItem.tags && selectedItem.tags.length > 0) {
      for (const tag of selectedItem.tags) {
        const normalizedTag = tag.toLowerCase();
        if (itemMap[normalizedTag] && itemMap[normalizedTag].length > 0) return itemMap[normalizedTag][0];
      }
    }

    // 4. Default search keyword for the item if no product is found
    // (Note: The user said no category fallback, but as an absolute last resort 
    // for a selected item we can build a quick search object if needed, 
    // but the plan says "preview override product prioritization")
    return null;
  }, [selectedItem, itemMap, overrides]);

  // Carousel logic for global products (only active when no item is selected)
  const { activeIndex, setActiveIndex, next } = useAutoRotateSuggestions(
    activeGlobalProducts.length,
    5000,
    !!selectedItem || isHoveringPanel || activeGlobalProducts.length <= 1
  );

  const finalProduct = selectedItem ? productToShow : activeGlobalProducts[activeIndex];
  const isFeatured = !selectedItem;

  const partnerIntegrations = configs?.[SETTINGS_KEYS.PARTNER_INTEGRATIONS];
  const partnerDisplay = useMemo(
    () =>
      finalProduct
        ? resolveAffiliatePartnerDisplay(finalProduct, partnerIntegrations)
        : null,
    [finalProduct, partnerIntegrations]
  );

  // Fallback Image Logic (4 Levels Centralized)
  const displayImage = useMemo(() => {
    return resolveAffiliateProductImage({
      product: finalProduct,
      partnerId: finalProduct?.provider,
      adminSuitcasePlaceholders: suitcasePlaceholders,
      failedImages: failedImages
    });
  }, [finalProduct, suitcasePlaceholders, failedImages]);

  return (
    <div
      onMouseEnter={() => setIsHoveringPanel(true)}
      onMouseLeave={() => setIsHoveringPanel(false)}
      className="w-full h-full min-h-0 bg-[#0b0f19]/40 backdrop-blur-sm rounded-[20px] border border-white/5 flex flex-col group/panel transition-all duration-500 hover:border-indigo-500/30 shadow-2xl shadow-black/40"
    >
      {/* Header Badge */}
      <div className="shrink-0 p-4 pb-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isFeatured ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-400'}`}>
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isFeatured ? 'text-amber-500/80' : 'text-indigo-400/80'}`}>
            Suggerimenti
          </span>
        </div>

        {isFeatured && activeGlobalProducts.length > 1 && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover/panel:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); setActiveIndex((activeIndex - 1 + activeGlobalProducts.length) % activeGlobalProducts.length); }}
              className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {finalProduct ? (
        <>
          <div className="flex-1 min-h-0 flex flex-col px-4 pt-4 overflow-hidden">
            {/* Product Image Section — si riduce se lo spazio verticale è limitato */}
            <div className="relative min-h-0 flex-1 basis-0 w-full mb-4 flex items-start justify-center overflow-hidden">
              <div className="relative aspect-square h-full max-w-full w-auto max-h-full rounded-2xl overflow-hidden bg-slate-950 border border-white/5 group/img shadow-inner flex items-center justify-center">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={finalProduct.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110"
                    onError={(e) => {
                      const src = (e.target as HTMLImageElement).src;
                      if (src) {
                        setFailedImages(prev => {
                          const next = new Set(prev);
                          next.add(src);
                          return next;
                        });
                      }
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-800">
                    <ItemCategoryIcon category={selectedItem?.category || category} className="w-16 h-16 opacity-20" />
                  </div>
                )}
                {finalProduct.price && (
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-xl bg-orange-500 text-white text-[11px] font-black shadow-lg shadow-orange-500/20">
                    €{finalProduct.price}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover/panel:opacity-100 transition-opacity duration-700" />
              </div>
            </div>

            {/* Meta — non comprime il footer CTA */}
            <div className="shrink-0 space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[9px] font-black uppercase tracking-tighter text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                  {partnerDisplay?.badgeLabel ?? 'Offerta consigliata'}
                </span>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-[10px]">★</span>
                  ))}
                  <span className="text-[9px] text-slate-500 ml-1">(4.8)</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-100 leading-tight line-clamp-3">
                {finalProduct.name}
              </h3>
            </div>
          </div>

          {/* Footer CTA — shrink-0, mai compresso dal flex layout */}
          <div className="shrink-0 px-4 pb-4 pt-4 border-t border-white/5">
            <div className="space-y-3">
              <a
                href={(() => {
                  const pid = finalProduct.product_id || "";
                  if (pid.startsWith("search:")) {
                    const keyword = pid.replace("search:", "");
                    return onLinkBuildSearch(keyword, selectedItem?.category || category);
                  }
                  return onLinkBuild(finalProduct.provider || "amazon", pid);
                })()}
                onClick={() => {
                  affiliateTrackingService.trackClickOut({
                    partnerId: finalProduct.provider || 'amazon',
                    sourceType: 'suitcase',
                    category: finalProduct.category || category || 'gear',
                    productId: finalProduct.product_id || undefined,
                    searchQuery: finalProduct.product_id?.startsWith('search:') ? finalProduct.product_id.replace('search:', '') : undefined
                  });
                }}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/20 group/btn"
              >
                <span>
                  {partnerDisplay?.ctaLabel ?? 'Scopri il prodotto'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
              </a>
              <p className="text-[9px] text-slate-500 text-center font-medium opacity-60">
                Acquistando tramite TouringDiary supporti il nostro progetto.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/50 flex items-center justify-center border border-white/5 shadow-inner">
            <Package className="w-8 h-8 text-slate-600" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400">Nessun dettaglio extra</p>
            <p className="text-[10px] text-slate-600 leading-relaxed max-w-[180px]">
              Seleziona un oggetto per vedere suggerimenti specifici per il tuo viaggio.
            </p>
          </div>
        </div>
      )}

      {/* Persistence indicator for carousel */}
      {isFeatured && activeGlobalProducts.length > 1 && (
        <div className="shrink-0 px-4 pb-3 flex gap-1 justify-center">
          {activeGlobalProducts.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-700 ${idx === activeIndex ? 'w-6 bg-amber-500' : 'w-1 bg-slate-800'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
