import { ExternalLink, Image as ImageIcon, ShoppingBag } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePartnerIntegrations } from '@/hooks/usePartnerIntegrations';
import { affiliateTrackingService } from '@/services/affiliateTrackingService';
import { buildAffiliateLink } from '@/services/partnerIntegrationService';
import type { PartnerIntegration } from '@/types/partners';
import type {
  ResolvedAffiliateProduct,
  ResolvedAffiliateProductLink,
  Suitcase,
  SuitcaseItem,
} from '@/types/suitcase';
import { normalizeItemName } from '@/utils/tagDerivation';
import { resolveAffiliatePartnerDisplay, resolveAffiliateProductImage } from './SuitcaseUtils';

interface AffiliateSuggestionBoxProps {
  activeSuitcase: Suitcase | null;
  itemMap: Record<string, ResolvedAffiliateProduct[]>;
  categoryMap: Record<string, ResolvedAffiliateProduct[]>;
  overrides: Record<string, ResolvedAffiliateProduct>;
  globalMap: ResolvedAffiliateProduct[];
  placeholders: Record<string, ResolvedAffiliateProduct[]>;
  onLinkBuild: (provider: string, url: string) => string;
  adminSuitcasePlaceholders?: Record<string, string>;
  /** True while suitcase affiliate triggers are still loading. */
  isLoadingAffiliateTriggers?: boolean;
}

export const AffiliateSuggestionBox: React.FC<AffiliateSuggestionBoxProps> = ({
  activeSuitcase,
  itemMap,
  categoryMap,
  overrides,
  globalMap,
  placeholders,
  onLinkBuild,
  adminSuitcasePlaceholders = {},
  isLoadingAffiliateTriggers = false,
}) => {
  const [rotationIndex, setRotationIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const { integrations, loading: partnersLoading } = usePartnerIntegrations();

  // 1. Partner Logic (Centralized and moved up for provider-agnostic default resolving)
  const allPartners = useMemo(() => {
    if (!integrations?.partners) return [];
    return Object.values(integrations.partners)
      .filter((p) => p.enabled)
      .map((p) => ({
        ...p,
        // Proactively fix logo path for PNG and SVG
        display_options: {
          ...p.display_options,
          logo_url: p.display_options?.logo_url
            ? p.display_options.logo_url.startsWith('/') ||
              p.display_options.logo_url.startsWith('http')
              ? p.display_options.logo_url
              : `/assets/logos/${p.display_options.logo_url}`
            : undefined,
        },
      }))
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }, [integrations]);

  const defaultPartnerId = useMemo<string | null>(() => {
    if (!allPartners.length) return null;

    const primary = allPartners.find((p) => p.is_primary);

    return primary?.id || allPartners[0]?.id || null;
  }, [allPartners]);

  // Rotazione: global + placeholders globali + categorie + placeholders di categoria
  const rotatablePlaceholdersCount = useMemo(() => {
    const categoryLists = Object.values(categoryMap).reduce(
      (n, list) => n + (list?.length || 0),
      0,
    );
    const categoryPlaceholders = Object.entries(placeholders).reduce((n, [key, list]) => {
      if (key === 'global') return n;
      return n + (list?.length || 0);
    }, 0);
    return (
      (placeholders.global?.length || 0) +
      (globalMap.length || 0) +
      categoryLists +
      categoryPlaceholders
    );
  }, [placeholders, globalMap, categoryMap]);

  useEffect(() => {
    if (rotatablePlaceholdersCount === 0) return;
    const timer = setInterval(() => {
      setRotationIndex((prev) => prev + 1);
    }, 8000);
    return () => clearInterval(timer);
  }, [rotatablePlaceholdersCount]);

  /**
   * Resolver intelligente per gli override
   */
  const findOverrideMatch = useCallback(
    (itemName: string, overridesMap: Record<string, ResolvedAffiliateProduct>) => {
      const normalizedName = normalizeItemName(itemName);
      if (!normalizedName) return null;

      // 1. Match Esatto (Key nel DB è già normalizzata)
      if (overridesMap[normalizedName]) return overridesMap[normalizedName];

      // 2. Match Parziale
      const partialMatchKey = Object.keys(overridesMap).find(
        (key) => normalizedName.includes(key) || key.includes(normalizedName),
      );

      if (partialMatchKey) return overridesMap[partialMatchKey];

      return null;
    },
    [],
  );

  type RawAffiliateProduct =
    | (ResolvedAffiliateProduct & { product?: never })
    | { product: ResolvedAffiliateProduct };

  const suggestion: ResolvedAffiliateProduct | null =
    useMemo<ResolvedAffiliateProduct | null>(() => {
      const isWrappedAffiliateProduct = (
        value: RawAffiliateProduct,
      ): value is { product: ResolvedAffiliateProduct } => {
        return value !== null && typeof value === 'object' && 'product' in value;
      };

      const mapToProduct = (raw: RawAffiliateProduct): ResolvedAffiliateProduct | null => {
        const prod: ResolvedAffiliateProduct = isWrappedAffiliateProduct(raw) ? raw.product : raw;

        const id = typeof prod.id === 'string' && prod.id.trim() ? prod.id.trim() : undefined;
        const name =
          (typeof prod.name === 'string' && prod.name.trim() ? prod.name.trim() : undefined) ||
          (typeof prod.title === 'string' && prod.title.trim() ? prod.title.trim() : undefined);

        // Senza id/nome reali non è un prodotto presentabile (né trackabile).
        if (!id || !name) return null;

        const productObj: ResolvedAffiliateProduct = {
          id,
          name,
          ...(prod.description != null && prod.description !== ''
            ? { description: prod.description }
            : {}),
          ...(prod.price != null && prod.price !== '' ? { price: prod.price } : {}),
          ...(prod.category != null ? { category: prod.category } : {}),
          ...(prod.provider != null
            ? { provider: prod.provider }
            : defaultPartnerId
              ? { provider: defaultPartnerId }
              : {}),
          ...(prod.url ? { url: prod.url } : {}),
          preferred_partners: prod.preferred_partners || [],
          target_categories: prod.target_categories || [],
          product_links: prod.product_links || [],
          ...(prod.image_url || prod.imageUrl
            ? { imageUrl: prod.image_url || prod.imageUrl || undefined }
            : {}),
        };

        return productObj;
      };

      const targetSuitcase = activeSuitcase;
      const items: SuitcaseItem[] = targetSuitcase?.suitcase_items || [];
      const categories: string[] = Array.from(
        new Set(items.map((i: SuitcaseItem) => i.category.toLowerCase())),
      );

      // 1. CONTESTUALE (Overrides -> Item Match)
      for (const item of items) {
        const match = findOverrideMatch(item.name || '', overrides);
        if (match) {
          const mapped = mapToProduct(match);
          if (mapped) return mapped;
        }
      }
      for (const item of items) {
        const name = (item.name || '').toLowerCase();
        const triggerItems =
          itemMap[name] || Object.entries(itemMap).find(([k]) => name.includes(k))?.[1];
        if (triggerItems && triggerItems.length > 0) {
          const mapped = mapToProduct(triggerItems[0]);
          if (mapped) return mapped;
        }
      }

      // 2. PARTNER CATEGORIA (Rotati)
      for (const cat of categories) {
        const list = categoryMap[cat];
        if (list && list.length > 0) {
          const mapped = mapToProduct(list[rotationIndex % list.length]);
          if (mapped) return mapped;
        }
      }

      // 3. PARTNER GLOBAL (Rotati)
      if (globalMap && globalMap.length > 0) {
        const mapped = mapToProduct(globalMap[rotationIndex % globalMap.length]);
        if (mapped) return mapped;
      }

      // 4. PLACEHOLDER CATEGORIA (config affiliate reale, non inventata)
      for (const cat of categories) {
        const list = placeholders[cat];
        if (list && list.length > 0) {
          const mapped = mapToProduct(list[rotationIndex % list.length]);
          if (mapped) return mapped;
        }
      }

      // 5. PLACEHOLDER GLOBAL
      const globalPlaceholders = placeholders.global || [];
      if (globalPlaceholders.length > 0) {
        const mapped = mapToProduct(globalPlaceholders[rotationIndex % globalPlaceholders.length]);
        if (mapped) return mapped;
      }

      return null;
    }, [
      activeSuitcase,
      rotationIndex,
      itemMap,
      categoryMap,
      overrides,
      placeholders,
      globalMap,
      defaultPartnerId,
      findOverrideMatch,
    ]);

  const compatiblePartners = useMemo(() => {
    if (!suggestion || !allPartners.length) return [];

    // Estrarre ID partner che hanno un link esplicito nei product_links
    const explicitLinkPartnerIds = (suggestion.product_links || []).map(
      (l: ResolvedAffiliateProductLink) => l.partner_id,
    );

    let filtered: typeof allPartners = [];

    // 1. Includi SEMPRE partner con link esplicito (Richiesta Utente)
    const explicitPartners = allPartners.filter((p) => explicitLinkPartnerIds.includes(p.id));

    // 2. Se preferred_partners è valorizzato → aggiungi quelli
    if (suggestion.preferred_partners && suggestion.preferred_partners.length > 0) {
      const preferred = allPartners.filter((p) => suggestion.preferred_partners?.includes(p.id));
      filtered = Array.from(new Set([...explicitPartners, ...preferred]));
    } else {
      filtered = explicitPartners;
    }

    // 3. Altrimenti match tra target_categories e partner.capabilities (se ancora vuoto)
    if (
      filtered.length === 0 &&
      suggestion.target_categories &&
      suggestion.target_categories.length > 0
    ) {
      filtered = allPartners.filter((p) =>
        p.capabilities.some((cap) => suggestion.target_categories?.includes(cap)),
      );
    }

    // 4. Fallback Provider-Agnostic basato sul partner primario o abilitato con priorità maggiore
    if (filtered.length === 0) {
      const primary = allPartners.find((p) => p.is_primary);
      if (primary) {
        filtered = [primary];
      } else if (allPartners.length > 0) {
        filtered = [allPartners[0]];
      }
    }

    return filtered;
  }, [allPartners, suggestion]);

  const primaryPartner = useMemo(
    () => compatiblePartners.find((p) => p.is_primary) || compatiblePartners[0],
    [compatiblePartners],
  );

  const secondaryPartners = useMemo(
    () => compatiblePartners.filter((p) => p.id !== primaryPartner?.id),
    [compatiblePartners, primaryPartner],
  );

  const partnerDisplay = useMemo(
    () => (suggestion ? resolveAffiliatePartnerDisplay(suggestion, integrations?.partners) : null),
    [suggestion, integrations?.partners],
  );

  const displayImage = useMemo(() => {
    if (!suggestion) return null;
    return resolveAffiliateProductImage({
      product: suggestion,
      partnerId: primaryPartner?.id,
      adminSuitcasePlaceholders: adminSuitcasePlaceholders,
      failedImages: failedImages,
    });
  }, [suggestion, primaryPartner, adminSuitcasePlaceholders, failedImages]);

  if (partnersLoading || isLoadingAffiliateTriggers) {
    return (
      <div className="bg-[#0b0f19]/80 backdrop-blur-md rounded-[20px] border border-white/5 p-4 h-full min-h-0 flex flex-col gap-4 relative group">
        <div className="shrink-0 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <h4 className="text-[10px] xl:text-[12px] font-black text-indigo-400/80 uppercase tracking-widest">
            Consigli utili
          </h4>
        </div>
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Caricamento suggerimenti affiliate…
          </p>
        </div>
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className="bg-[#0b0f19]/80 backdrop-blur-md rounded-[20px] border border-white/5 p-4 h-full min-h-0 flex flex-col gap-4 relative group">
        <div className="shrink-0 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <h4 className="text-[10px] xl:text-[12px] font-black text-indigo-400/80 uppercase tracking-widest">
            Consigli utili
          </h4>
        </div>
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Nessun suggerimento affiliate disponibile al momento.
          </p>
        </div>
      </div>
    );
  }

  const finalSuggestion = suggestion;
  const displayLabels = partnerDisplay ?? {
    badgeLabel: 'Suggerimento',
    ctaLabel: 'Scopri il prodotto',
    scopriCtaLabel: 'Scopri il prodotto',
  };

  const getAffiliateLink = (partner: PartnerIntegration): string => {
    // 1. Check for specific partner link override
    const partnerLink = (finalSuggestion.product_links || []).find(
      (l: ResolvedAffiliateProductLink) => l.partner_id === partner.id,
    );

    if (partnerLink) {
      if (partnerLink.url_override) return partnerLink.url_override;
      // Search tracked sul partner (contratto buildAffiliateLink); '' se affiliate non configurato
      return buildAffiliateLink(partner, {
        query: partnerLink.query || finalSuggestion.name,
      });
    }

    // 2. Legacy/Direct URL fallback
    if (finalSuggestion.url && partner.id === finalSuggestion.provider) {
      return onLinkBuild(partner.id, finalSuggestion.url);
    }

    // 3. Generic partner-search (dominio previsto: stesso contratto di AffiliateCTA)
    return buildAffiliateLink(partner, { query: finalSuggestion.name });
  };

  const primaryAffiliateLink = primaryPartner ? getAffiliateLink(primaryPartner) : '';
  const secondaryPartnersWithLinks = secondaryPartners.filter((p) => Boolean(getAffiliateLink(p)));

  /**
   * trackClickOut è async, restituisce Promise<boolean> e non propaga reject
   * (errori già loggati nel servizio). Non await: window.open deve restare
   * nel gesto utente (mobile/tablet popup / gesture stack).
   * Pattern allineato a AffiliateCTA / SuitcaseItemRow (fire-and-forget + open immediato).
   */
  const trackAndOpen = (partner: PartnerIntegration): void => {
    const link = getAffiliateLink(partner);
    if (!link) return;

    const productId = finalSuggestion.id;
    if (!productId) return;

    affiliateTrackingService.trackClickOut({
      partnerId: partner.id,
      sourceType: 'suitcase',
      category: finalSuggestion.category || 'gear',
      productId,
    });
    window.open(link, '_blank', 'noopener,noreferrer');
  };
  return (
    <div className="bg-[#0b0f19]/80 backdrop-blur-md rounded-[20px] border border-white/5 p-4 h-full min-h-0 flex flex-col gap-4 relative group">
      {/* HEADER */}
      <div className="shrink-0 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <h4 className="text-[10px] xl:text-[12px] font-black text-indigo-400/80 uppercase tracking-widest">
          Consigli utili
        </h4>
      </div>

      {/* IMAGE PLACEHOLDER — si riduce se lo spazio verticale è limitato */}
      <div className="shrink min-h-0 flex-1 basis-0 w-full flex items-start justify-center overflow-hidden">
        <div className="w-full aspect-video max-h-full rounded-xl bg-[#06080d]/60 border border-white/5 flex flex-col items-center justify-center gap-2 relative overflow-hidden group-hover:border-indigo-500/20 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] to-transparent opacity-80" />
          {displayImage ? (
            <img
              src={displayImage}
              alt={finalSuggestion.name}
              className="w-full h-full object-cover relative z-local-raised drop-shadow-2xl"
              onError={(e) => {
                const src = (e.target as HTMLImageElement).src;
                if (src) {
                  setFailedImages((prev) => {
                    const next = new Set(prev);
                    next.add(src);
                    return next;
                  });
                }
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 relative z-local-raised opacity-30 text-slate-300">
              <ImageIcon className="w-8 h-8" />
              <span className="text-[10px] xl:text-[12px] font-black uppercase tracking-widest">
                No Image
              </span>
            </div>
          )}
        </div>
      </div>

      {/* META INFO */}
      <div className="shrink-0 flex flex-col gap-2.5">
        <div className="flex items-center">
          <div className="px-1.5 py-0.5 select-none rounded bg-indigo-600/20 border border-indigo-500/20 text-[8px] xl:text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5 line-clamp-1 border-dotted">
            {displayLabels.badgeLabel}
          </div>
        </div>

        <h3 className="text-base xl:text-[18px] font-bold text-white leading-tight font-serif truncate">
          {finalSuggestion.name}
        </h3>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* FOOTER CTA — shrink-0, mai compresso dal flex layout */}
      <div className="shrink-0 flex flex-col gap-2.5 mt-auto">
        {primaryPartner && primaryAffiliateLink ? (
          <button
            type="button"
            onClick={() => trackAndOpen(primaryPartner)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all duration-300 flex items-center justify-center gap-2 group/btn relative overflow-hidden min-h-11"
          >
            <span className="text-xs font-black text-white uppercase tracking-widest relative z-local-raised truncate">
              {displayLabels.scopriCtaLabel}
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-indigo-100 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform relative z-local-raised shrink-0" />
          </button>
        ) : secondaryPartnersWithLinks.length === 0 ? (
          <p className="text-center text-[11px] text-slate-500 font-medium leading-relaxed px-2 py-2">
            Suggerimento disponibile, ma nessun partner affiliate utilizzabile al momento.
          </p>
        ) : null}

        {/* SECONDARY PARTNERS BAR — solo partner con link affiliate/search utilizzabile */}
        {secondaryPartnersWithLinks.length > 0 && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] xl:text-[11px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">
                Scopri su
              </span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {secondaryPartnersWithLinks.map((partner) => (
                <button
                  type="button"
                  key={partner.id}
                  onClick={() => trackAndOpen(partner)}
                  className="h-8 group/logo relative flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                  title={partner.label}
                >
                  {partner.display_options?.logo_url ? (
                    <img
                      src={partner.display_options.logo_url}
                      alt={partner.label}
                      className="h-full w-auto object-contain brightness-75 hover:brightness-100 transition-all filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                    />
                  ) : (
                    <span className="text-[10px] xl:text-[12px] font-bold text-slate-400 hover:text-white transition-colors">
                      {partner.label}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        {primaryPartner ? (
          <p className="text-[9px] xl:text-[11px] font-medium text-slate-300/80 text-center mx-2 leading-relaxed pt-1">
            Acquistando tramite TouringDiary supporti il nostro progetto.
          </p>
        ) : null}
      </div>
    </div>
  );
};
