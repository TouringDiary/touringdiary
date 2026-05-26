import { addAiSuggestedItemsAsync } from '@/services/suitcase/suitcaseItemsService';
import { normalizeItemName } from '@/utils/tagDerivation';

// ─── Scalable tag → packing-item mapping ─────────────────────────────────────
const TAG_ITEM_MAP: Record<string, { name: string; category: string }[]> = {
  mare: [
    { name: 'Crema solare', category: 'Igiene' },
    { name: 'Costume da bagno', category: 'Abbigliamento' },
    { name: 'Occhiali da sole', category: 'Abbigliamento' },
    { name: 'Sandali', category: 'Abbigliamento' },
  ],
  montagna: [
    { name: 'Scarpe trekking', category: 'Abbigliamento' },
    { name: 'Giacca impermeabile', category: 'Abbigliamento' },
    { name: 'Bastoncini trekking', category: 'Extra' },
  ],
  business: [
    { name: 'Laptop', category: 'Elettronica' },
    { name: 'Caricatore laptop', category: 'Elettronica' },
    { name: 'Biglietti da visita', category: 'Documenti' },
  ],
  cultura: [
    { name: 'Guida turistica', category: 'Documenti' },
    { name: 'Scarpe comode', category: 'Abbigliamento' },
    { name: 'Power bank', category: 'Elettronica' },
  ],
  volo: [
    { name: 'Documento identità', category: 'Documenti' },
    { name: 'Adattatore presa', category: 'Elettronica' },
    { name: 'Cuscino cervicale', category: 'Extra' },
  ],
  treno: [
    { name: 'Biglietto treno', category: 'Documenti' },
    { name: 'Cuffie', category: 'Elettronica' },
    { name: 'Libro/Podcast', category: 'Extra' },
  ],
  freddo: [
    { name: 'Cappello lana', category: 'Abbigliamento' },
    { name: 'Guanti', category: 'Abbigliamento' },
    { name: 'Sciarpa', category: 'Abbigliamento' },
  ],
  caldo: [
    { name: 'Cappello sole', category: 'Abbigliamento' },
    { name: 'Ventaglio', category: 'Extra' },
  ],
  pioggia: [
    { name: 'Ombrello', category: 'Extra' },
    { name: 'K-way', category: 'Abbigliamento' },
  ],
  weekend: [
    { name: 'Zaino piccolo', category: 'Extra' },
  ],
  long_trip: [
    { name: 'Kit lavaggio panni', category: 'Igiene' },
  ],
};

const UNIVERSAL_DEFAULTS: { name: string; category: string }[] = [
  { name: 'Caricabatterie telefono', category: 'Elettronica' },
  { name: 'Farmaci base', category: 'Igiene' },
  { name: 'Documenti', category: 'Documenti' },
];

export const seedAiSuggestions = async (
  suitcaseId: string,
  tags: string[],
  existingItems: { name: string; is_ai_suggestion: boolean }[],
  suggestionContext?: string
): Promise<number> => {
  const existingNormalized = new Set(
    existingItems.map(i => normalizeItemName(i.name))
  );

  const candidates: { name: string; category: string }[] = [...UNIVERSAL_DEFAULTS];
  tags.forEach(tag => {
    if (TAG_ITEM_MAP[tag]) candidates.push(...TAG_ITEM_MAP[tag]);
  });

  const seen = new Set<string>();
  const toInsert = candidates.filter(item => {
    const key = normalizeItemName(item.name);
    if (seen.has(key) || existingNormalized.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (toInsert.length === 0) return 0;

  await addAiSuggestedItemsAsync(suitcaseId, toInsert, suggestionContext);
  return toInsert.length;
};
