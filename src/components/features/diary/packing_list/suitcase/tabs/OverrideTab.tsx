import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Package } from 'lucide-react';
import { Suitcase, SuitcaseItem } from '@/types/suitcase';
import { normalizeItemName } from '@/utils/tagDerivation';
import { usePartnerIntegrations } from '@/hooks/usePartnerIntegrations';
import {
  fetchMasterTemplatesAsync,
  fetchTemplateItemsAsync,
  saveTemplateOverrideAsync
} from '@/services/suitcase/suitcaseEditorialService';
import {
  fetchAllAffiliateProductsAsync,
  fetchAllAffiliateProductLinksAsync,
  fetchTemplateOverridesAsync
} from '@/services/suitcase/suitcaseAffiliateService';
import { AffiliateProductLink } from '@/types/partners';
import { SuggestionProduct, ItemOverride } from '@/types/suitcase';

// Sub-components
import { TemplateSelector } from './override/TemplateSelector';
import { CategoryAccordion } from './override/CategoryAccordion';
import { ProductPicker } from './override/ProductPicker';
import { ItemOverrideRow } from './override/ItemOverrideRow';
import { PartnerLinksPanel } from './override/PartnerLinksPanel';

export const OverrideTab: React.FC<{ selectedMasterId: string | null; onSelectMaster: (id: string) => void }> = ({ selectedMasterId, onSelectMaster }) => {
  const [masters, setMasters] = useState<Suitcase[]>([]);
  const [items, setItems] = useState<SuitcaseItem[]>([]);
  const [products, setProducts] = useState<SuggestionProduct[]>([]);
  const [productLinks, setProductLinks] = useState<AffiliateProductLink[]>([]);
  const [overrides, setOverrides] = useState<Record<string, ItemOverride>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [openPickerId, setOpenPickerId] = useState<string | null>(null);
  const [expandedItemCats, setExpandedItemCats] = useState<Set<string>>(new Set());
  const { integrations } = usePartnerIntegrations();
  const activePartners = useMemo(() => {
    if (!integrations?.partners) return [];
    return Object.values(integrations.partners).filter(p => p.enabled);
  }, [integrations]);

  const detectPartnerFromUrl = (url: string) => {
    const lowerUrl = url.toLowerCase();
    for (const p of activePartners) {
      if (p.affiliate?.base_url) {
        try {
          const domain = new URL(p.affiliate.base_url).hostname.replace('www.', '').split('.')[0];
          if (domain && domain.length > 2 && lowerUrl.includes(domain)) return p.id;
        } catch (e) { }
      }
    }
    if (lowerUrl.includes('amazon.')) return 'amazon';
    if (lowerUrl.includes('ebay.')) return 'ebay';
    if (lowerUrl.includes('mediaworld.')) return 'mediaworld';
    if (lowerUrl.includes('shein.')) return 'shein';
    if (lowerUrl.includes('unieuro.')) return 'unieuro';
    if (lowerUrl.includes('zalando.')) return 'zalando';
    if (lowerUrl.includes('decathlon.')) return 'decathlon';
    return null;
  };

  const groupedPartners = useMemo(() => {
    const groups: Record<string, typeof activePartners> = { 'Generale': [], 'Elettronica': [], 'Fashion': [], 'Esperienze': [], 'Trasporti': [], 'Ticket': [], 'Hotel': [], 'Altro': [] };
    activePartners.forEach(p => {
      const groupName = p.group || 'Generale';
      if (groups[groupName]) groups[groupName].push(p); else groups['Altro'].push(p);
    });
    return Object.entries(groups).filter(([_, list]) => list.length > 0);
  }, [activePartners]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, { items: SuitcaseItem[], configured: number }> = {};
    items.forEach(item => {
      const cat = item.category || 'Altro';
      if (!groups[cat]) groups[cat] = { items: [], configured: 0 };
      groups[cat].items.push(item);
      const normalized = normalizeItemName(item.name);
      if (overrides[normalized]?.is_saved) groups[cat].configured += 1;
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items, overrides]);

  const fetchData = useCallback(async () => {
    try {
      const [mastersData, productsData, linksData] = await Promise.all([
        fetchMasterTemplatesAsync(),
        fetchAllAffiliateProductsAsync(),
        fetchAllAffiliateProductLinksAsync()
      ]);

      setMasters(mastersData);
      if (!selectedMasterId && mastersData.length > 0) {
        onSelectMaster(mastersData[0].id);
      }

      setProducts(productsData);
      setProductLinks(linksData);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  }, [selectedMasterId, onSelectMaster]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!selectedMasterId) return;
    const fetchDetails = async () => {
      try {
        const [itemsData, triggersData] = await Promise.all([
          fetchTemplateItemsAsync(selectedMasterId),
          fetchTemplateOverridesAsync(selectedMasterId)
        ]);

        setItems(itemsData);

        const map: Record<string, ItemOverride> = {};
        triggersData.forEach(t => {
          const parts = t.trigger_key.split(':');
          if (parts.length >= 3) {
            const name = parts.slice(2).join(':');
            map[name] = { id: t.id, trigger_key: t.trigger_key, product_id: t.product_id || undefined, is_saved: true };
          }
        });
        setOverrides(map);
      } catch (e) {
        console.error(e);
      }
    };
    fetchDetails();
  }, [selectedMasterId]);

  const handleOverrideChange = (itemName: string, productId: string | undefined) => {
    const normalized = normalizeItemName(itemName);
    setOverrides(prev => ({ ...prev, [normalized]: { ...prev[normalized], trigger_key: `override:${selectedMasterId}:${normalized}`, product_id: productId, is_saved: false } }));
  };

  const saveOverride = async (itemName: string) => {
    const normalized = normalizeItemName(itemName);
    const override = overrides[normalized];
    if (!override || !selectedMasterId) return;
    setOverrides(prev => ({ ...prev, [normalized]: { ...prev[normalized], is_saving: true } }));
    try {
      const result = await saveTemplateOverrideAsync(
        itemName,
        override.id,
        override.product_id,
        override.trigger_key
      );

      if (result.action === 'delete') {
        setOverrides(prev => {
          const next = { ...prev };
          delete next[normalized];
          return next;
        });
      } else {
        if (result.action === 'create') {
          const updatedProds = await fetchAllAffiliateProductsAsync();
          setProducts(updatedProds);
        }

        setOverrides(prev => ({
          ...prev,
          [normalized]: {
            ...prev[normalized],
            id: result.finalTriggerId,
            product_id: result.targetProductId,
            is_saving: false,
            is_saved: true
          }
        }));
      }
    } catch (e) {
      console.error(e);
      setOverrides(prev => ({ ...prev, [normalized]: { ...prev[normalized], is_saving: false } }));
    }
  };

  if (isLoading) return <div className="flex-1 flex items-center justify-center bg-slate-950"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="flex h-full animate-in fade-in duration-500">
      <TemplateSelector masters={masters} selectedMasterId={selectedMasterId} onSelectMaster={onSelectMaster} />

      <main className="flex-1 lg:overflow-y-auto bg-slate-950 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <div>
              <h2 className="text-2xl font-black text-white">Override Prodotti</h2>
              <p className="text-sm text-slate-400 mt-1">Configura suggerimenti specifici per ogni oggetto di questo template.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-orange-200 text-sm font-bold">
              <Package className="w-4 h-4" /> {items.length} Oggetti
            </div>
          </div>

          <div className="grid gap-3">
            {groupedItems.map(([category, data]) => {
              const isExpanded = expandedItemCats.has(category);
              const allSaved = data.configured === data.items.length && data.items.length > 0;

              return (
                <div key={category} className="space-y-3">
                  <CategoryAccordion
                    category={category}
                    configuredCount={data.configured}
                    totalCount={data.items.length}
                    isExpanded={isExpanded}
                    onToggle={() => {
                      const next = new Set(expandedItemCats);
                      if (next.has(category)) next.delete(category); else next.add(category);
                      setExpandedItemCats(next);
                    }}
                    allSaved={allSaved}
                  />

                  {isExpanded && (
                    <div className="grid gap-4 pl-4 border-l border-white/5 ml-6 animate-in slide-in-from-top-2 duration-300">
                      {data.items.map(item => {
                        const normalized = normalizeItemName(item.name);
                        const override = overrides[normalized];
                        const currentProduct = products.find(p => p.id === override?.product_id);

                        return (
                          <ItemOverrideRow
                            key={item.id}
                            item={item}
                            override={override}
                            currentProduct={currentProduct}
                            hasChanges={!!(override && !override.is_saved)}
                            onSave={() => saveOverride(item.name)}
                            picker={
                              <ProductPicker
                                item={item}
                                products={products}
                                currentProduct={currentProduct}
                                productSearch={productSearch}
                                setProductSearch={setProductSearch}
                                isOpen={openPickerId === item.id}
                                onOpenToggle={() => setOpenPickerId(openPickerId === item.id ? null : item.id)}
                                onSelect={(pid) => { handleOverrideChange(item.name, pid); setOpenPickerId(null); }}
                              />
                            }
                            partnerPanel={currentProduct && (
                              <PartnerLinksPanel
                                currentProduct={currentProduct}
                                groupedPartners={groupedPartners}
                                productLinks={productLinks}
                                override={override}
                                detectPartnerFromUrl={detectPartnerFromUrl}
                                onLinksUpdated={(newLinks) => setProductLinks(newLinks)}
                              />
                            )}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};
