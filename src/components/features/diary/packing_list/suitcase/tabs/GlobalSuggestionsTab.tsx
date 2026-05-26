import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Search, Plus, Edit3, Trash2, Database as DatabaseIcon, ShoppingBag, X, Save } from 'lucide-react';
import { usePartnerIntegrations } from '@/hooks/usePartnerIntegrations';
import {
  fetchGlobalTriggersAsync,
  upsertAffiliateProductLinksBulkFromDtosAsync,
  fetchAllAffiliateProductsAsync,
  fetchAllAffiliateProductLinksAsync,
  upsertAffiliateProductFromDtoAsync,
  UpsertAffiliateProductDto,
  UpsertAffiliateLinkBulkItemDto
} from '@/services/suitcase/suitcaseAffiliateService';
import { AffiliateProductLink } from '@/types/partners';
import { AdminImageInput } from '@/components/admin/AdminImageInput';
import { CanonicalAffiliateTriggerRelation, SuggestionProduct } from '@/types/suitcase';

type EditableSuggestionProduct = {
  id?: string;
  name: string;
  image_url?: string | null;
  preferred_partners: string[];
  target_categories: string[];
  target_tags: string[];
  is_active: boolean;
};

type PartnerLinkDraft = {
  id?: string;
  partnerId: string;
  searchQuery: string;
  urlOverride?: string | null;
  imageOverride?: string | null;
  trackingOverride?: string | null;
  priority?: number | null;
};

export const GlobalSuggestionsTab: React.FC = () => {
  const [products, setProducts] = useState<SuggestionProduct[]>([]);
  const [triggers, setTriggers] = useState<CanonicalAffiliateTriggerRelation[]>([]);
  const [productLinks, setProductLinks] = useState<AffiliateProductLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<EditableSuggestionProduct | null>(null);
  const [activePartnerLinks, setActivePartnerLinks] = useState<PartnerLinkDraft[]>([]);
  const [search, setSearch] = useState('');
  const { integrations } = usePartnerIntegrations();

  const activePartners = useMemo(() => {
    if (!integrations?.partners) return [];
    return Object.values(integrations.partners).filter(p => p.enabled);
  }, [integrations]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productsData, triggersData, linksData] = await Promise.all([
        fetchAllAffiliateProductsAsync(),
        fetchGlobalTriggersAsync(),
        fetchAllAffiliateProductLinksAsync()
      ]);

      setProducts(productsData);
      setTriggers(triggersData);
      setProductLinks(linksData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (editingProduct?.id) {
      const drafts: PartnerLinkDraft[] = productLinks
        .filter(l => l.product_id === editingProduct.id)
        .map(l => ({
          id: l.id,
          partnerId: l.partner_id,
          searchQuery: l.query,
          urlOverride: l.url_override ?? null,
          imageOverride: l.image_override ?? null,
          trackingOverride: l.tracking_override ?? null,
          priority: l.priority ?? null
        }));
      setActivePartnerLinks(drafts);
    } else if (editingProduct) {
      setActivePartnerLinks([]);
    }
  }, [editingProduct, productLinks]);

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    try {
      const productDto: UpsertAffiliateProductDto = {
        id: editingProduct.id,
        name: editingProduct.name,
        imageUrl: editingProduct.image_url ?? null,
        preferredPartners: editingProduct.preferred_partners,
        targetCategories: editingProduct.target_categories,
        targetTags: editingProduct.target_tags,
        isActive: editingProduct.is_active
      };

      const savedProduct = await upsertAffiliateProductFromDtoAsync(productDto);

      if (activePartnerLinks.length > 0) {
        const dtos: UpsertAffiliateLinkBulkItemDto[] = activePartnerLinks
          .filter(l => l.partnerId && savedProduct.id && (l.searchQuery || editingProduct.name))
          .map(l => ({
            id: l.id,
            productId: savedProduct.id,
            partnerId: l.partnerId,
            searchQuery: l.searchQuery || editingProduct.name || '',
            urlOverride: l.urlOverride ?? null,
            imageOverride: l.imageOverride ?? null,
            trackingOverride: l.trackingOverride ?? null,
            priority: l.priority ?? null
          }));

        if (dtos.length > 0) {
          await upsertAffiliateProductLinksBulkFromDtosAsync(dtos);
        }
      }

      setEditingProduct(null);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex-1 flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="flex h-full animate-in fade-in duration-500">
      <div className="flex-1 lg:overflow-y-auto p-8 bg-slate-950">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Catalogo Prodotti</h2>
              <p className="text-sm text-slate-400">Gestisci i prodotti di affiliazione globali e i loro trigger.</p>
            </div>
            <button
              onClick={() => setEditingProduct({
                name: '',
                image_url: '',
                preferred_partners: [],
                target_categories: [],
                target_tags: [],
                is_active: true
              })}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Nuovo Prodotto
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cerca prodotti..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 pl-12 pr-4 py-3 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map(p => {
              const productTriggers = triggers.filter(t => t.product_id === p.id);
              return (
                <div key={p.id} className="group bg-slate-900/50 border border-white/5 hover:border-white/10 rounded-2xl p-4 flex gap-4 transition-all hover:bg-slate-900 shadow-xl">
                  <div className="w-20 h-20 rounded-xl bg-white overflow-hidden p-2 shrink-0 shadow-inner">
                    <img src={p.image_url} alt="" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Prodotto Globale</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            setEditingProduct({
                              id: p.id,
                              name: p.name,
                              image_url: p.image_url || '',
                              preferred_partners: p.preferred_partners || [],
                              target_categories: p.target_categories || [],
                              target_tags: p.target_tags || [],
                              is_active: p.is_active ?? true
                            })
                          } className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"><Edit3 className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">{p.name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5">
                        <DatabaseIcon className="w-3 h-3 text-slate-600" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{productTriggers.length} Triggers</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {editingProduct && (
        <div className="w-[450px] shrink-0 bg-slate-900 border-l border-slate-800 animate-in slide-in-from-right duration-300 flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-lg font-black text-white">Editor Prodotto</h3>
            <button onClick={() => setEditingProduct(null)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-500"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 lg:overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block">Nome Prodotto</label>
                <input type="text" value={editingProduct.name || ''} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white" />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block">Preferred Partners (ID list)</label>
                  <input type="text" placeholder="es. amazon,ebay" value={editingProduct.preferred_partners?.join(',') || ''} onChange={e => setEditingProduct({ ...editingProduct, preferred_partners: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-indigo-400 font-mono" />
                </div>
              </div>
              <div className="pt-2">
                <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block">Immagine Prodotto</label>
                <AdminImageInput imageUrl={editingProduct.image_url || ''} onChange={(data) => setEditingProduct({ ...editingProduct, image_url: data.imageUrl })} category="shop" />
              </div>
              <div className="grid grid-cols-1 gap-4 pt-2">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block">Target Categories (separate da virgola)</label>
                  <input type="text" placeholder="es. Elettronica, Fotografia" value={editingProduct.target_categories?.join(', ') || ''} onChange={e => setEditingProduct({ ...editingProduct, target_categories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-emerald-400" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-1.5 block">Tags per Matching (separati da virgola)</label>
                  <input type="text" placeholder="es. waterproof, usb-c, leggero" value={editingProduct.target_tags?.join(', ') || ''} onChange={e => setEditingProduct({ ...editingProduct, target_tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-orange-400" />
                </div>
              </div>
            </div>

            {editingProduct.id && (
              <div className="pt-6 border-t border-white/5 space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">Configurazioni Partner</h4>
                <div className="space-y-4">
                  {activePartners.map(partner => {
                    const link = activePartnerLinks.find(l => l.partnerId === partner.id);
                    const isConfigured = !!link;
                    return (
                      <div key={partner.id} className={`p-4 rounded-2xl border ${isConfigured ? 'bg-indigo-600/5 border-indigo-500/20' : 'bg-slate-950 border-white/5 opacity-60'}`}>
                        <div className="flex items-center gap-3 mb-4">
                          {partner.display_options?.logo_url ? <img src={partner.display_options.logo_url} alt="" className="h-4 w-auto object-contain" /> : <ShoppingBag className="w-4 h-4 text-slate-500" />}
                          <span className="text-xs font-bold text-white">{partner.label}</span>
                          {!isConfigured && <button onClick={() => setActivePartnerLinks(prev => [...prev, { partnerId: partner.id, searchQuery: editingProduct.name }])} className="ml-auto text-[9px] font-black text-indigo-400">Attiva Link</button>}
                        </div>
                        {isConfigured && (
                          <div className="space-y-3">
                            <input type="text" placeholder="Query" value={link.searchQuery || ''} onChange={e => setActivePartnerLinks(prev => prev.map(l => l.partnerId === partner.id ? { ...l, searchQuery: e.target.value } : l))} className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white" />
                            <input type="text" placeholder="URL Override" value={link.urlOverride || ''} onChange={e => setActivePartnerLinks(prev => prev.map(l => l.partnerId === partner.id ? { ...l, urlOverride: e.target.value } : l))} className="w-full bg-slate-900 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] text-indigo-400 font-mono" />
                            <button onClick={() => setActivePartnerLinks(prev => prev.filter(l => l.partnerId !== partner.id))} className="text-[9px] font-black uppercase text-red-500">Rimuovi</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-white/5 bg-slate-900/50">
            <button onClick={handleSaveProduct} className="w-full py-3 bg-indigo-600 text-white text-sm font-black rounded-xl flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Salva Prodotto</button>
          </div>
        </div>
      )}
    </div>
  );
};
