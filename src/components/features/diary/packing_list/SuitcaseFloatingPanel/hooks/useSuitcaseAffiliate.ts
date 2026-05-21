import { useState, useEffect } from 'react';
import { fetchAffiliateTriggersAsync } from '@/services/suitcaseService';
import { ResolvedAffiliateProduct, Suitcase, JoinedAffiliateTrigger, JoinedAffiliateProduct } from '@/types/suitcase';
import { normalizeItemName } from '@/utils/tagDerivation';

export interface RuntimeAffiliateProduct extends ResolvedAffiliateProduct {
  trigger_priority: number;
}

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

        (data || []).forEach((t: JoinedAffiliateTrigger) => {
          const rawProduct = Array.isArray(t.product)
            ? t.product[0]
            : t.product;
          if (!rawProduct) return;

          const product: RuntimeAffiliateProduct = { 
            id: rawProduct.id,
            name: rawProduct.name,
            title: rawProduct.name,
            description: rawProduct.description || '',
            price: rawProduct.estimated_price !== null && rawProduct.estimated_price !== undefined 
              ? String(rawProduct.estimated_price) 
              : null,
            category: rawProduct.target_categories && rawProduct.target_categories.length > 0 
              ? rawProduct.target_categories[0] 
              : null,
            image_url: rawProduct.image_url,
            imageUrl: rawProduct.image_url,
            target_categories: rawProduct.target_categories,
            provider: rawProduct.provider,
            product_id: rawProduct.product_id,
            is_active: rawProduct.is_active,
            preferred_partners: rawProduct.preferred_partners,
            url: null,
            trigger_priority: t.priority || 0,
            product_links: rawProduct.links || rawProduct.affiliate_product_links || [] 
          };

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
