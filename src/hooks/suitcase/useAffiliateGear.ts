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

        const enabledPartnerIds = Object.entries(integrations)
          .filter(([, partner]) => partner.enabled)
          .map(([id]) => id);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(itineraryTags), JSON.stringify(currentItems.map(i => i.is_checked)), JSON.stringify(integrations)]);

  return { data, isLoading };
};
