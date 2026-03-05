import { getCachedSetting, SETTINGS_KEYS } from '../../settingsService';

// Helper per normalizzare la sottocategoria (es. "scavi" -> "archaeology")
export const normalizeSubCategory = (subCategory: string): string => {
    if (!subCategory) return '_generic_';
    
    const clean = subCategory.toLowerCase().trim()
        .replace(/\s+/g, '_') // spazi -> underscore
        .replace(/[^a-z0-9_]/g, ''); // solo caratteri validi
        
    // 1. Cerca nei sinonimi espliciti (DAL DB CACHE)
    const normalizationMap = getCachedSetting<Record<string, string>>(SETTINGS_KEYS.TAXONOMY_NORMALIZATION);
    if (normalizationMap && normalizationMap[clean]) {
        return normalizationMap[clean];
    }
    
    return clean;
};

// Helper per correggere la categoria in base alla sottocategoria E al nome
export const getCorrectCategory = (subCategory: string, currentCategory: string, poiName: string = ''): string => {
    
    const nameLower = poiName.toLowerCase().trim();
    const subLower = subCategory.toLowerCase().trim();

    // LOGICA EURISTICA: Nomi comuni che forzano la categoria
    // Questi pattern sono troppo specifici per il DB, rimangono hardcoded per velocità
    if (nameLower.includes('supermercato') || nameLower.includes('minimarket') || nameLower.includes('alimentari') || nameLower.includes('market') || nameLower.includes('conad') || nameLower.includes('carrefour') || nameLower.includes('coop') || nameLower.includes('decò') || nameLower.includes('dok') || nameLower.includes('md')) {
        return 'food';
    }

    if (nameLower.includes('lido ') || nameLower.startsWith('lido') || nameLower.includes('beach') || nameLower.includes('bagni ') || nameLower.includes('cala ') || nameLower.includes('baia ') || nameLower.includes('spiaggia') || nameLower.includes('villa comunale') || nameLower.includes('parco ') || nameLower.includes('giardini ') || nameLower.includes('riserva naturale') || nameLower.includes('oasi ')) {
        return 'nature';
    }
    
    if (nameLower.includes('chiesa') || nameLower.includes('cattedrale') || nameLower.includes('duomo') || nameLower.includes('museo') || nameLower.includes('scavi') || nameLower.includes('parco archeologico') || nameLower.includes('templi') || nameLower.includes('santuario')) {
        return 'monument';
    }

    // 1. Normalizza prima la sottocategoria (Usa DB)
    const normalizedSub = normalizeSubCategory(subCategory);
    let cat = (currentCategory || '').toLowerCase().trim();

    // 2. Normalizzazione Categoria in Entrata
    if (cat === 'shopping' || cat === 'store') cat = 'shop';
    if (cat === 'entertainment' || cat === 'fun' || cat === 'nightlife') cat = 'leisure';
    if (cat === 'culture' || cat === 'history' || cat === 'art') cat = 'monument';
    if (cat === 'restaurant' || cat === 'dining') cat = 'food';
    if (cat === 'accomodation' || cat === 'sleeping') cat = 'hotel';
    if (cat === 'outdoors') cat = 'nature';

    // 3. Check diretto nel dizionario statico (DAL DB CACHE)
    const taxonomyMap = getCachedSetting<Record<string, string>>(SETTINGS_KEYS.TAXONOMY_MAP);
    if (taxonomyMap && taxonomyMap[normalizedSub]) return taxonomyMap[normalizedSub];
    
    // 4. Heuristics di emergenza (se DB vuoto/cache fallita)
    if (normalizedSub.includes('restaurant') || normalizedSub.includes('pizza')) return 'food';
    if (normalizedSub.includes('hotel') || normalizedSub.includes('bnb')) return 'hotel';
    
    // 5. VALIDAZIONE FINALE CHECK CONSTRAINT
    const allowed = ['monument', 'food', 'hotel', 'nature', 'discovery', 'leisure', 'shop'];
    if (allowed.includes(cat)) {
        return cat;
    }

    return 'discovery'; 
};

export const resolveCategoryFromDict = (term: string, dict: Record<string, { cat: string, sub: string }>): { cat: string, sub: string } | null => {
    const cleanTerm = term.toLowerCase().trim();
    if (dict[cleanTerm]) return dict[cleanTerm];
    
    const dbKeys = Object.keys(dict);
    const sortedKeys = dbKeys.sort((a,b) => b.length - a.length);
    
    for (const key of sortedKeys) {
        if (cleanTerm.includes(key)) {
            return dict[key];
        }
    }
    return null;
};

// NEW: Generatore dinamico stringa tassonomia per prompt AI
// Legge la struttura POI dai settings e la formatta per l'LLM
export const generateAllowedCategoriesPromptString = (): string => {
    const structure = getCachedSetting<Record<string, { value: string, label: string }[]>>(SETTINGS_KEYS.POI_STRUCTURE);
    
    // Fallback statico se la cache non è pronta (es. primo avvio offline)
    if (!structure || Object.keys(structure).length === 0) {
        return `
- MONUMENTI: chiesa, castello, museo, piazza, archaeology, palazzo, monumento
- CIBO: restaurant, pizzeria, trattoria, street_food, pastry, gelato, bar
- SVAGO: disco, theater, cinema, zoo, spa, stadium
- NATURA: beach_free, beach_club, park, hiking, viewpoint, lake, river
- SHOPPING: fashion, crafts, jewelry, souvenir
- HOTEL: hotel, bnb, resort
`;
    }

    let promptString = '';
    const labelMapping: Record<string, string> = {
        'monument': 'MONUMENTI',
        'food': 'CIBO',
        'leisure': 'SVAGO',
        'nature': 'NATURA',
        'shop': 'SHOPPING',
        'hotel': 'HOTEL',
        'discovery': 'ALTRO'
    };

    for (const [key, items] of Object.entries(structure)) {
        // Salta discovery se vuota o non rilevante per classificazione stretta
        if (key === 'discovery' && items.length === 0) continue;
        
        const label = labelMapping[key] || key.toUpperCase();
        const subCats = items.map(i => i.value).join(', ');
        promptString += `- ${label}: ${subCats}\n`;
    }
    
    return promptString;
};