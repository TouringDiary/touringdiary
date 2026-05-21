import { useState, useEffect } from 'react';
import { useConfig } from '@/context/ConfigContext';
import { normalizeItemName } from '@/utils/tagDerivation';
import { fetchAffiliateGearAsync } from '@/services/suitcaseService';
import { SuitcaseItem, DbAffiliateProduct } from '@/types/suitcase';

export const useAffiliateGear = (itineraryTags: string[], currentItems: SuitcaseItem[]) => {
  const { configs } = useConfig();
  const integrations = configs?.partner_integrations || {};

  const [data, setData] = useState<DbAffiliateProduct[]>([]);
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

        const dbData = await fetchAffiliateGearAsync(itineraryTags, missingItems);
        const products = dbData || [];
        const normalizedSuitcaseItems = currentItems.map((i: SuitcaseItem) => normalizeItemName(i.name || ''));

        const filtered = products.filter(product => {
          if (!product.provider) return false;
          const partner = integrations[product.provider];
          if (!partner || !partner.enabled) return false;

          if (product.trigger_items && product.trigger_items.length > 0) {
            const hasOverlap = product.trigger_items.some((trigger: string) =>
              normalizedSuitcaseItems.includes(normalizeItemName(trigger))
            );
            if (hasOverlap) return false;
          }

          return true;
        }).slice(0, 4);

        if (isMounted) setData(filtered);
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
