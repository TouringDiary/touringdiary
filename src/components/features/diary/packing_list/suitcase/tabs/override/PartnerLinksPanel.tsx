import React from 'react';
import { ShoppingBag, Edit3, Plus, Trash2, ExternalLink } from 'lucide-react';
import { AffiliateProductLink, PartnerIntegration } from '@/types/partners';
import { SuggestionProduct, ItemOverride } from '@/types/suitcase';
import {
  upsertAffiliateProductLinkWithConflictAsync,
  deleteAffiliateProductLinkAsync,
  fetchProductLinksForProductAsync,
  fetchAllAffiliateProductLinksAsync
} from '@/services/suitcase/suitcaseAffiliateService';

interface PartnerLinksPanelProps {
  currentProduct: SuggestionProduct;
  groupedPartners: [string, PartnerIntegration[]][];
  productLinks: AffiliateProductLink[];
  override: ItemOverride | undefined;
  onLinksUpdated: (newLinks: AffiliateProductLink[]) => void;
  detectPartnerFromUrl: (url: string) => string | null;
}

export const PartnerLinksPanel: React.FC<PartnerLinksPanelProps> = ({
  currentProduct,
  groupedPartners,
  productLinks,
  override,
  onLinksUpdated,
  detectPartnerFromUrl
}) => {
  return (
    <div className="mt-4 pt-4 border-t border-white/5 space-y-6 animate-in slide-in-from-top-2 duration-300">
      {groupedPartners.map(([groupName, partners]) => (
        <div key={groupName} className="space-y-3">
          <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500/80 mb-2 px-1">{groupName}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {partners.map(partner => {
              const link = productLinks.find(l => l.product_id === currentProduct.id && l.partner_id === partner.id);
              const hasProduct = !!override?.product_id;
              const hasLink = !!link;
              const hasUrl = !!link?.url_override;

              let statusLabel = "NON CONFIGURATO";
              let statusColor = "bg-slate-800 text-slate-500";

              if (!hasProduct) {
                statusLabel = "NON CONFIGURATO";
                statusColor = "bg-slate-800/50 text-slate-600";
              } else if (!hasLink) {
                statusLabel = "PRODOTTO SELEZIONATO";
                statusColor = "bg-orange-500/10 text-orange-400 border border-orange-500/20";
              } else if (!hasUrl) {
                statusLabel = "LINK INSERITO";
                statusColor = "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
              } else {
                statusLabel = "COMPLETO";
                statusColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
              }

              return (
                <div key={partner.id} className={`p-4 rounded-2xl border transition-all ${hasLink ? 'bg-white/[0.02] border-white/10 shadow-lg' : 'bg-slate-950 border-white/5 opacity-50 hover:opacity-100 hover:border-indigo-500/30'}`}>
                  <div className="flex items-center gap-6 mb-3">
                    <div className="h-14 min-w-[100px] px-3 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md overflow-hidden border border-slate-100">
                      {partner.display_options?.logo_url ? (
                        <img
                          src={partner.display_options.logo_url.startsWith('http') || partner.display_options.logo_url.startsWith('/') ? partner.display_options.logo_url : `/${partner.display_options.logo_url}`}
                          alt=""
                          className="h-full w-auto object-contain max-w-[120px] p-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent && !parent.querySelector('.fallback-icon')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'fallback-icon flex items-center justify-center';
                              fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-slate-800"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <ShoppingBag className="w-6 h-6 text-slate-800" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="text-sm font-black uppercase tracking-widest text-slate-200 block truncate leading-tight mb-1">{partner.label}</span>
                      <div className="mt-1">
                        <div className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight ${statusColor}`}>
                          {statusLabel}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={async () => {
                          const url = prompt(`Incolla URL prodotto per ${partner.label}:`, link?.url_override || '');
                          if (url === null) return;
                          
                          const imgOverride = prompt(`(Opzionale) Incolla URL immagine override per ${partner.label}:`, link?.image_override || '');
                          if (imgOverride === null) return;

                          try {
                            const detectedPartnerId = detectPartnerFromUrl(url);
                            const finalPartnerId = detectedPartnerId || partner.id;

                            await upsertAffiliateProductLinkWithConflictAsync({
                              existingLinkId: link?.id,
                              productId: currentProduct.id,
                              partnerId: finalPartnerId,
                              searchQuery: currentProduct.name,
                              urlOverride: url,
                              imageOverride: imgOverride || null
                            });

                            const newLinks = await fetchProductLinksForProductAsync(currentProduct.id);
                            onLinksUpdated(newLinks);
                          } catch (e) { console.error(e); }
                        }}
                        className="p-2 bg-white/5 rounded-lg text-slate-400 hover:bg-indigo-600 hover:text-white transition-all"
                        title={hasLink ? 'Modifica Link/Immagine' : 'Aggiungi Link/Immagine'}
                      >
                        {hasLink ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      </button>
                      {hasLink && (
                        <button
                          onClick={async () => {
                            if (!confirm('Rimuovere questo link?')) return;
                            await deleteAffiliateProductLinkAsync(link.id);
                            const newLinks = await fetchAllAffiliateProductLinksAsync();
                            onLinksUpdated(newLinks);
                          }}
                          className="p-2 hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {hasLink && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono bg-slate-900/50 p-2 rounded-lg border border-white/5 mt-2">
                      <ExternalLink className="w-3 h-3 shrink-0 text-indigo-500" />
                      <span className="truncate">{link.url_override || link.query}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
