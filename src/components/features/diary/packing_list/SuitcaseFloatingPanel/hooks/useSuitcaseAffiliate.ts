import { useState, useEffect } from 'react';
import {
  fetchAffiliateTriggersAsync,
  adaptTriggerRelationToRuntime,
} from '@/services/suitcase/suitcaseAffiliateService';
import {
  CanonicalAffiliateTriggerRelation,
  RuntimeAffiliateProduct,
  Suitcase,
} from '@/types/suitcase';
import { normalizeItemName } from '@/utils/tagDerivation';

export const useSuitcaseAffiliate = (contextSuitcase: Suitcase | undefined | null) => {
  const [affiliateMaps, setAffiliateMaps] = useState<{
    items: Record<string, RuntimeAffiliateProduct[]>;
    categories: Record<string, RuntimeAffiliateProduct[]>;
    overrides: Record<string, RuntimeAffiliateProduct>;
    global: RuntimeAffiliateProduct[];
    placeholders: Record<string, RuntimeAffiliateProduct[]>;
  }>({ items: {}, categories: {}, overrides: {}, global: [], placeholders: {} });

  const [isLoadingTriggers, setIsLoadingTriggers] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTriggers = async () => {
      setIsLoadingTriggers(true);
      try {
        const items = contextSuitcase?.suitcase_items || [];
        const uniqueTags = Array.from(new Set(items.flatMap(i => i.affiliate_tags || [])));
        const uniqueCategories = Array.from(new Set(items.map(i => i.category.toLowerCase())));
        const sourceTemplateId = contextSuitcase?.source_template_id ?? null;

        const uniqueTagsParam = contextSuitcase ? uniqueTags : [];
        const uniqueCategoriesParam = contextSuitcase ? uniqueCategories : [];

        const data = await fetchAffiliateTriggersAsync({
          uniqueTags: uniqueTagsParam,
          uniqueCategories: uniqueCategoriesParam,
          sourceTemplateId
        });

        if (!isMounted) return;

        const maps: {
          items: Record<string, RuntimeAffiliateProduct[]>;
          categories: Record<string, RuntimeAffiliateProduct[]>;
          overrides: Record<string, RuntimeAffiliateProduct>;
          global: RuntimeAffiliateProduct[];
          placeholders: Record<string, RuntimeAffiliateProduct[]>;
        } = {
          items: {},
          categories: {},
          overrides: {},
          global: [],
          placeholders: {}
        };

        (data || []).forEach((t: CanonicalAffiliateTriggerRelation) => {
          const product = adaptTriggerRelationToRuntime(t);
          if (!product) return;

          const key = t.trigger_key?.toLowerCase();

          if (key && key.startsWith('override:') && sourceTemplateId) {
            const parts = t.trigger_key.split(':');
            if (parts.length >= 3) {
              const itemName = normalizeItemName(parts.slice(2).join(':'));
              maps.overrides[itemName] = product;
            }
          } else if (t.trigger_type === 'item' && key) {
            if (!maps.items[key]) maps.items[key] = [];
            maps.items[key].push(product);
          } else if (t.trigger_type === 'category' && key) {
            if (!maps.categories[key]) maps.categories[key] = [];
            maps.categories[key].push(product);
          } else if (t.trigger_type === 'global') {
            maps.global.push(product);
          }
        });

        // Ensure priority sorting (DESC)
        Object.values(maps.items).forEach(list => list.sort((a, b) => b.trigger_priority - a.trigger_priority));
        Object.values(maps.categories).forEach(list => list.sort((a, b) => b.trigger_priority - a.trigger_priority));
        maps.global.sort((a, b) => b.trigger_priority - a.trigger_priority);

        setAffiliateMaps(maps);
      } catch (err) {
        console.error("Error pre-fetching affiliate triggers:", err);
      } finally {
        if (isMounted) setIsLoadingTriggers(false);
      }
    };

    fetchTriggers();
    return () => { isMounted = false; };
  }, [contextSuitcase?.id]);

  return { affiliateMaps, isLoadingTriggers };
};
