import { SuggestionProduct, SuitcaseItem } from '@/types/suitcase';
import { OverrideTab } from './tabs/OverrideTab';
import { GlobalSuggestionsTab } from './tabs/GlobalSuggestionsTab';
import { TemplateLibraryTab } from './tabs/TemplateLibraryTab';
import { StandardItemsTab } from './tabs/StandardItemsTab';
import { TemplateSpecificItemsTab } from './tabs/TemplateSpecificItemsTab';
import { AiCatalogTab } from './tabs/AiCatalogTab';

export { OverrideTab, GlobalSuggestionsTab, TemplateLibraryTab, StandardItemsTab, TemplateSpecificItemsTab, AiCatalogTab };

// --- SHARED UTILS (To be extracted in next phase) ---
export const getRelevantProducts = (item: SuitcaseItem, products: SuggestionProduct[]) => {
  const normalizedItemName = (item.name || '').toLowerCase();
  const itemCategory = (item.category || '').toLowerCase();
  const itemTags = (item.affiliate_tags || []).map(t => t.toLowerCase());

  // Definizione di categorie e tag "affini" per migliorare il matching semantico
  const affinityMap: Record<string, string[]> = {
    'abbigliamento': ['vestiti', 'scarpe', 'intimo', 'pantaloni', 'maglie', 'calze'],
    'elettronica': ['tech', 'smartphone', 'powerbank', 'caricabatterie', 'cuffie', 'fotografia'],
    'farmaci': ['medicina', 'sanitario', 'protezione', 'salute'],
    'igiene': ['beauty', 'cosmetici'],
    'documenti': ['viaggio', 'assicurazione', 'portafoglio', 'cartaceo'],
    'accessori': ['organizzazione', 'bagaglio'],
    'calzature': ['scarpe', 'ciabatte', 'sandali', 'sneakers'],
  };

  const itemAffinities = affinityMap[itemCategory] || [];

  return products.filter(p => {
    const productName = p.name.toLowerCase();
    const productCategories = (p.target_categories || []).map(c => c.toLowerCase());
    const productTags = (p.target_tags || []).map(t => t.toLowerCase());

    // 1. Match Nome (Fuzzy base: il nome dell'oggetto è contenuto nel nome prodotto o viceversa)
    const nameMatch = productName.includes(normalizedItemName) || normalizedItemName.includes(productName);

    // 2. Match Categoria Diretta o Affine
    const categoryMatch = productCategories.includes(itemCategory) ||
      productCategories.some(c => itemAffinities.includes(c));

    // 3. Match Tags
    const tagMatch = itemTags.some(it => productTags.includes(it)) ||
      productTags.some(pt => itemAffinities.includes(pt));

    // MOSTRA SOLO SE C'È ALMENO UN MATCH SIGNIFICATIVO
    return nameMatch || categoryMatch || tagMatch;
  });
};