import { useState, useEffect } from 'react';
import { useConfig } from '@/context/ConfigContext';
import { fetchAffiliateGearAsync } from '@/services/suitcase/suitcaseAffiliateService';
import { SuitcaseItem, ResolvedAffiliateProduct } from '@/types/suitcase';
import { PartnerIntegration } from '@/types/partners';

export const useAffiliateGear = (itineraryTags: string[], currentItems: SuitcaseItem[]) => {
  const { configs } = useConfig();
  const integrations: Record<string, PartnerIntegration> = configs?.partner_integrations ?? {};

  const [data, setData] = useState<ResolvedAffiliateProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Il fetch usa solo gli id partner `enabled` (non l'intero oggetto integrations).
  const enabledPartnerIds = Object.entries(integrations)
    .filter(([, partner]) => partner.enabled)
    .map(([id]) => id)
    .sort();
  const enabledPartnersKey = enabledPartnerIds.join(',');

  // biome-ignore lint/correctness/useExhaustiveDependencies: tags/items serializzati per evitare refetch su nuovi array equivalenti; enabledPartnersKey copre i partner rilevanti
  useEffect(() => {
    let isMounted = true;

    const fetchGear = async () => {
      if (itineraryTags.length === 0 && currentItems.length === 0) {
        if (isMounted) setData([]);
        return;
      }

      setIsLoading(true);

      try {
        const missingItems = currentItems
          .filter((i: SuitcaseItem) => !i.is_checked)
          .map((i: SuitcaseItem) => i.name || '');

        const suitcaseItemNames = currentItems.map((i: SuitcaseItem) => i.name || '');

        const products = await fetchAffiliateGearAsync(
          itineraryTags,
          missingItems,
          enabledPartnerIds,
          suitcaseItemNames
        );

        if (isMounted) setData(products);
      } catch (err) {
        console.error("Error fetching affiliate gear:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchGear();

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(itineraryTags), JSON.stringify(currentItems.map(i => i.is_checked)), enabledPartnersKey]);

  return { data, isLoading };
};
