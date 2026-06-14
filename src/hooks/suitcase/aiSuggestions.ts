import { addAiSuggestedItemsAsync } from '@/services/suitcase/suitcaseItemsService';
import { getRejectionsBySuitcaseAsync } from '@/services/suitcase/suitcaseRejectionsService';
import { normalizeItemName } from '@/utils/tagDerivation';
import {
  getDraftLocalRejections,
  getGuestSuitcase,
  insertDraftAiSuggestions,
  isDraftWorkspaceId,
} from '@/utils/guestSuitcaseHelper';

// ─── Scalable tag → packing-item mapping ─────────────────────────────────────
// Target: ~181 items across 9 categories.
// Categories: Abbigliamento, Igiene, Documenti, Elettronica, Farmaci, Bambini, Animali, Accessori & Organizzazione, Extra.

const TAG_ITEM_MAP: Record<string, { name: string; category: string }[]> = {
  mare: [
    { name: 'Costume da bagno', category: 'Abbigliamento' },
    { name: 'Infradito', category: 'Abbigliamento' },
    { name: 'Sandali', category: 'Abbigliamento' },
    { name: 'Telo mare', category: 'Extra' },
    { name: 'Crema solare', category: 'Igiene' },
    { name: 'Doposole', category: 'Igiene' },
    { name: 'Occhiali da sole', category: 'Abbigliamento' },
    { name: 'Borsa mare', category: 'Extra' },
    { name: 'Cappello da sole', category: 'Abbigliamento' },
    { name: 'Maschera e boccaglio', category: 'Extra' },
    { name: 'Custodia impermeabile smartphone', category: 'Accessori & Organizzazione' },
  ],
  montagna: [
    { name: 'Scarponi trekking', category: 'Abbigliamento' },
    { name: 'Giacca a vento', category: 'Abbigliamento' },
    { name: 'Zaino trekking', category: 'Extra' },
    { name: 'Bastoncini trekking', category: 'Extra' },
    { name: 'Calze tecniche', category: 'Abbigliamento' },
    { name: 'Borraccia termica', category: 'Accessori & Organizzazione' },
    { name: 'Torcia LED', category: 'Extra' },
    { name: 'Coltellino multiuso', category: 'Extra' },
    { name: 'Crema protezione alta', category: 'Igiene' },
    { name: 'Gaiters', category: 'Abbigliamento' },
  ],
  business: [
    { name: 'Laptop', category: 'Elettronica' },
    { name: 'Camicia', category: 'Abbigliamento' },
    { name: 'Scarpe eleganti', category: 'Abbigliamento' },
    { name: 'Biglietti da visita', category: 'Documenti' },
    { name: 'Organizer cavi', category: 'Accessori & Organizzazione' },
    { name: 'Blazer', category: 'Abbigliamento' },
    { name: 'Cravatta', category: 'Abbigliamento' },
    { name: 'Cartelletta documenti', category: 'Documenti' },
    { name: 'Mouse wireless', category: 'Elettronica' },
    { name: 'Adattatore HDMI', category: 'Elettronica' },
  ],
  cultura: [
    { name: 'Scarpe comode', category: 'Abbigliamento' },
    { name: 'Guida turistica', category: 'Documenti' },
    { name: 'Zaino leggero', category: 'Extra' },
    { name: 'Taccuino e penna', category: 'Extra' },
    { name: 'Mappa offline', category: 'Documenti' },
    { name: 'Auricolari', category: 'Elettronica' },
    { name: 'Power bank', category: 'Elettronica' },
  ],
  volo: [
    { name: 'Passaporto', category: 'Documenti' },
    { name: 'Cuscino cervicale', category: 'Accessori & Organizzazione' },
    { name: 'Mascherina occhi 3D', category: 'Accessori & Organizzazione' },
    { name: 'Tappi orecchie', category: 'Accessori & Organizzazione' },
    { name: 'Bilancia bagaglio', category: 'Accessori & Organizzazione' },
    { name: 'Lucchetto TSA', category: 'Accessori & Organizzazione' },
    { name: 'Etichette bagaglio', category: 'Accessori & Organizzazione' },
    { name: 'Porta passaporto RFID', category: 'Accessori & Organizzazione' },
    { name: 'Calze a compressione', category: 'Abbigliamento' },
    { name: 'Adattatore cuffie aereo', category: 'Elettronica' },
  ],
  treno: [
    { name: 'Biglietto treno', category: 'Documenti' },
    { name: 'Cuffie noise-cancelling', category: 'Elettronica' },
    { name: 'Libro', category: 'Extra' },
    { name: 'Snack', category: 'Extra' },
    { name: 'Cuscino da viaggio', category: 'Accessori & Organizzazione' },
  ],
  freddo: [
    { name: 'Piumino pesante', category: 'Abbigliamento' },
    { name: 'Guanti', category: 'Abbigliamento' },
    { name: 'Sciarpa', category: 'Abbigliamento' },
    { name: 'Berretto lana', category: 'Abbigliamento' },
    { name: 'Abbigliamento termico', category: 'Abbigliamento' },
    { name: 'Calze lana', category: 'Abbigliamento' },
    { name: 'Maglione', category: 'Abbigliamento' },
    { name: 'Burrocacao protettivo', category: 'Igiene' },
  ],
  caldo: [
    { name: 'Cappello sole', category: 'Abbigliamento' },
    { name: 'Ventaglio', category: 'Extra' },
    { name: 'T-shirt leggere', category: 'Abbigliamento' },
    { name: 'Pantaloncini', category: 'Abbigliamento' },
    { name: 'Sandali aperti', category: 'Abbigliamento' },
    { name: 'Borraccia ghiacciata', category: 'Accessori & Organizzazione' },
  ],
  pioggia: [
    { name: 'Ombrello pieghevole', category: 'Extra' },
    { name: 'Giacca impermeabile', category: 'Abbigliamento' },
    { name: 'Coprizaino antipioggia', category: 'Extra' },
    { name: 'Scarpe waterproof', category: 'Abbigliamento' },
    { name: 'K-way', category: 'Abbigliamento' },
  ],
  weekend: [
    { name: 'Zaino weekend', category: 'Extra' },
    { name: 'Kit igiene travel size', category: 'Igiene' },
    { name: 'Beauty case compatto', category: 'Accessori & Organizzazione' },
  ],
  lungo_raggio: [
    { name: 'Packing Cubes', category: 'Accessori & Organizzazione' },
    { name: 'Kit lavaggio panni', category: 'Igiene' },
    { name: 'Lucchetto extra', category: 'Accessori & Organizzazione' },
    { name: 'Sacchetto panni sporchi', category: 'Extra' },
    { name: 'Multipresa da viaggio', category: 'Elettronica' },
    { name: 'Corda panni portatile', category: 'Extra' },
  ],
  famiglia: [
    { name: 'Pannolini', category: 'Bambini' },
    { name: 'Salviette bimbo', category: 'Bambini' },
    { name: 'Biberon', category: 'Bambini' },
    { name: 'Ciuccio', category: 'Bambini' },
    { name: 'Passeggino leggero', category: 'Bambini' },
    { name: 'Marsupio porta bimbo', category: 'Bambini' },
    { name: 'Giocattolo preferito', category: 'Bambini' },
    { name: 'Latte in polvere', category: 'Bambini' },
    { name: 'Bavaglino', category: 'Bambini' },
    { name: 'Fasciatoio portatile', category: 'Bambini' },
    { name: 'Crema barriera', category: 'Bambini' },
    { name: 'Set pappa bimbo', category: 'Bambini' },
    { name: 'Termos pappa', category: 'Bambini' },
    { name: 'Monitor neonato', category: 'Bambini' },
  ],
  pet: [
    { name: 'Cibo pet', category: 'Animali' },
    { name: 'Ciotole pieghevoli', category: 'Animali' },
    { name: 'Guinzaglio', category: 'Animali' },
    { name: 'Pettorina', category: 'Animali' },
    { name: 'Sacchetti igienici pet', category: 'Animali' },
    { name: 'Libretto sanitario pet', category: 'Animali' },
    { name: 'Cuccia portatile', category: 'Animali' },
    { name: 'Gioco preferito pet', category: 'Animali' },
    { name: 'Museruola', category: 'Animali' },
    { name: 'Spazzola pet', category: 'Animali' },
    { name: 'Salviette pet', category: 'Animali' },
    { name: 'Trasportino', category: 'Animali' },
  ],
  farmacia: [
    { name: 'Antidolorifico', category: 'Farmaci' },
    { name: 'Termometro digitale', category: 'Farmaci' },
    { name: 'Cerotti misti', category: 'Farmaci' },
    { name: 'Disinfettante', category: 'Farmaci' },
    { name: 'Fermenti lattici', category: 'Farmaci' },
    { name: 'Antidiarroico', category: 'Farmaci' },
    { name: 'Antistaminico', category: 'Farmaci' },
    { name: 'Farmaci cinetosi', category: 'Farmaci' },
    { name: 'Repellente insetti', category: 'Farmaci' },
    { name: 'Pomata post-puntura', category: 'Farmaci' },
    { name: 'Cerotti vesciche', category: 'Farmaci' },
    { name: 'Antiacido', category: 'Farmaci' },
    { name: 'Garze sterili', category: 'Farmaci' },
    { name: 'Gel muscolare', category: 'Farmaci' },
    { name: 'Integratori sali minerali', category: 'Farmaci' },
  ],
  igiene_completa: [
    { name: 'Spazzolino', category: 'Igiene' },
    { name: 'Dentifricio', category: 'Igiene' },
    { name: 'Deodorante', category: 'Igiene' },
    { name: 'Shampoo', category: 'Igiene' },
    { name: 'Bagnoschiuma', category: 'Igiene' },
    { name: 'Balsamo capelli', category: 'Igiene' },
    { name: 'Spazzola capelli', category: 'Igiene' },
    { name: 'Rasoio', category: 'Igiene' },
    { name: 'Schiuma da barba', category: 'Igiene' },
    { name: 'Kit manicure', category: 'Igiene' },
    { name: 'Assorbenti', category: 'Igiene' },
    { name: 'Crema idratante', category: 'Igiene' },
    { name: 'Fazzoletti di carta', category: 'Igiene' },
    { name: 'Salviettine igienizzanti', category: 'Igiene' },
    { name: 'Gel mani', category: 'Igiene' },
    { name: 'Cotton fioc', category: 'Igiene' },
    { name: 'Profumo', category: 'Igiene' },
    { name: 'Kit struccante', category: 'Igiene' },
    { name: 'Detergente intimo', category: 'Igiene' },
    { name: 'Flaconi viaggio silicone', category: 'Accessori & Organizzazione' },
  ],
  abbigliamento_base: [
    { name: 'Intimo', category: 'Abbigliamento' },
    { name: 'Calze', category: 'Abbigliamento' },
    { name: 'T-shirt', category: 'Abbigliamento' },
    { name: 'Pantaloni', category: 'Abbigliamento' },
    { name: 'Pigiama', category: 'Abbigliamento' },
    { name: 'Canotta', category: 'Abbigliamento' },
    { name: 'Gonna', category: 'Abbigliamento' },
    { name: 'Vestito', category: 'Abbigliamento' },
    { name: 'Abbigliamento sportivo', category: 'Abbigliamento' },
  ],
  elettronica_completa: [
    { name: 'Smartphone', category: 'Elettronica' },
    { name: 'Caricabatterie smartphone', category: 'Elettronica' },
    { name: 'Power bank alta capacità', category: 'Elettronica' },
    { name: 'Cuffie bluetooth', category: 'Elettronica' },
    { name: 'E-reader Kindle', category: 'Elettronica' },
    { name: 'Macchina fotografica', category: 'Elettronica' },
    { name: 'AirTag tracker', category: 'Elettronica' },
    { name: 'Cavo USB extra', category: 'Elettronica' },
    { name: 'Adattatore universale', category: 'Accessori & Organizzazione' },
    { name: 'Smartwatch', category: 'Elettronica' },
  ],
};

const UNIVERSAL_DEFAULTS: { name: string; category: string }[] = [
  { name: 'Documento identità', category: 'Documenti' },
  { name: 'Carte di credito', category: 'Documenti' },
  { name: 'Contanti', category: 'Documenti' },
  { name: 'Assicurazione viaggio', category: 'Documenti' },
  { name: 'Caricabatterie universale', category: 'Elettronica' },
  { name: 'Farmaci base', category: 'Farmaci' },
  { name: 'Borraccia', category: 'Extra' },
  { name: 'Zaino da giorno', category: 'Extra' },
  { name: 'Lucchetto valigia', category: 'Accessori & Organizzazione' },
];

export const seedAiSuggestions = async (
  suitcaseId: string,
  tags: string[],
  existingItems: { name: string; is_ai_suggestion: boolean }[],
  suggestionContext?: string,
  selectedCategories?: string[]
): Promise<number> => {
  const toInsert = await getAiCandidates(suitcaseId, tags, existingItems, selectedCategories);

  if (toInsert.length === 0) return 0;

  if (isDraftWorkspaceId(suitcaseId)) {
    insertDraftAiSuggestions(suitcaseId, toInsert, suggestionContext);
    return toInsert.length;
  }

  await addAiSuggestedItemsAsync(suitcaseId, toInsert, suggestionContext);
  return toInsert.length;
};

export const getAiCandidates = async (
  suitcaseId: string,
  tags: string[],
  existingItems: { name: string; is_ai_suggestion: boolean }[],
  selectedCategories?: string[]
): Promise<{ name: string; category: string }[]> => {
  // 1. Carica blacklist: locale su workspace draft, DB su valigie persistite
  let rejections: string[] = [];
  if (isDraftWorkspaceId(suitcaseId)) {
    const draft = getGuestSuitcase();
    if (draft?.id === suitcaseId) {
      rejections = getDraftLocalRejections(draft).map((r) => normalizeItemName(r.name));
    }
  } else {
    try {
      const dbRejections = await getRejectionsBySuitcaseAsync(suitcaseId);
      rejections = dbRejections.map((r) => normalizeItemName(r.name));
    } catch (e) {
      console.error("[getAiCandidates] Failed to load rejections:", e);
    }
  }

  // 2. Unifica oggetti esistenti e blacklist nel Set di esclusione
  const existingNormalized = new Set([
    ...existingItems.map(i => normalizeItemName(i.name)),
    ...rejections
  ]);

  const candidates: { name: string; category: string }[] = [...UNIVERSAL_DEFAULTS];
  
  // Aggiungiamo tag impliciti basati sui tag esistenti per arricchire la generazione
  const enrichedTags = [...tags];
  if (tags.includes('mare') || tags.includes('montagna')) enrichedTags.push('igiene_completa', 'abbigliamento_base');
  if (tags.includes('volo') || tags.includes('lungo_raggio')) enrichedTags.push('elettronica_completa', 'farmacia');

  // Logica Categorie -> Tag (Bambini -> famiglia, Animali -> pet)
  if (selectedCategories?.includes('Bambini')) enrichedTags.push('famiglia');
  if (selectedCategories?.includes('Animali')) enrichedTags.push('pet');

  enrichedTags.forEach(tag => {
    if (TAG_ITEM_MAP[tag]) candidates.push(...TAG_ITEM_MAP[tag]);
  });

  const seen = new Set<string>();
  const filtered = candidates.filter(item => {
    const key = normalizeItemName(item.name);
    
    // Filtro per categoria se specificato
    if (selectedCategories && selectedCategories.length > 0) {
      if (!selectedCategories.includes(item.category)) return false;
    }

    if (seen.has(key) || existingNormalized.has(key)) return false;
    seen.add(key);
    return true;
  });

  return filtered;
};
