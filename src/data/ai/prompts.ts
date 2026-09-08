import { getCachedSetting, SETTINGS_KEYS } from '../../services/settingsService';

// I template vengono ora recuperati dalla cache globale caricata all'avvio.
// Se mancano (es. primo avvio o offline), usiamo stringhe di fallback hardcoded qui.

const getTemplate = (key: string, fallback: string): string => {
  // Prova a leggere dalla cache settingsService
  const val = getCachedSetting<string>(key);
  return val && val.length > 10 ? val : fallback;
};

export const SYSTEM_PRECISION_HEADER = `
RUOLO: Sei un Auditor Turistico Supremo e Geografo Esperto.
LINGUA: RISPONDI SEMPRE ED ESCLUSIVAMENTE IN ITALIANO.
OBIETTIVO: Validazione TOTALE dei dati (A-Z) e Coerenza Geografica.
`;

export const SYSTEM_PEOPLE_HEADER = `
RUOLO: Sei un Biografo Storico ed Esperto di Cultura Locale della Campania.
LINGUA: RISPONDI SEMPRE ED ESCLUSIVAMENTE IN ITALIANO.
OBIETTIVO: Fornire dati biografici precisi, categorie dallo standard ammesso, date strutturate verificate e narrazioni coinvolgenti.
NON usare un campo "role": la tipologia è solo via specificCategorySlugs dallo standard.
`;

export const buildCityAuditPrompt = (cityName: string) => {
  const tpl = getTemplate(
    SETTINGS_KEYS.PROMPT_CITY_AUDIT,
    `SEI UN AUDITOR TURISTICO PER "{cityName}". OBIETTIVO: Identificare i 15-20 "Must-See" POI. OUTPUT JSON ARRAY.`,
  );
  return tpl.replace('{cityName}', cityName);
};

export const buildRegionalAnalysisPrompt = (
  regionName: string,
  existingZones: string[],
  minVisitors: number = 50000,
) => `
    SEI UN PIANIFICATORE TERRITORIALE STRATEGICO.
    Analizza la regione: "${regionName}".
    OBIETTIVO: Suddividere la regione in "Zone Turistiche".
    Filtro: min ${minVisitors} visitatori.
    ZONE ESISTENTI: ${JSON.stringify(existingZones)}
    OUTPUT JSON: { "region": "${regionName}", "zones": [{ "name": "...", "mainCities": [...] }] }
`;

export const buildZoneAnalysisPrompt = (
  zoneName: string,
  regionName: string,
  existingCities: string[],
  minVisitors: number = 5000,
) => `
    SEI UN ESPERTO DI GEOGRAFIA TURISTICA.
    ANALISI MICRO-ZONA: "${zoneName}" (${regionName}).
    COMPITO: Elenca TUTTE le città/borghi rilevanti.
    CRITERI: Stima > ${minVisitors} visitatori.
    FORMATO JSON OBBLIGATORIO:
    { "region": "${regionName}", "zones": [ { "name": "${zoneName}", "mainCities": [ { "name": "...", "visitors": 10000, "reason": "..." } ] } ] }
`;

export const buildVerifyPoisPrompt = (
  cityName: string,
  candidates: ReadonlyArray<{ id?: string | number; name?: string }>,
) => `
    SEI UN AUDITOR DIGITALE.
    Città: "${cityName}".
    Verifica esistenza/orari.
    INPUT: ${JSON.stringify(candidates)}
    OUTPUT JSON ARRAY: [{ "id": 0, "status": "valid"|"invalid" ... }]
`;

export const buildSuggestNewPoisPrompt = (
  cityName: string,
  needed: number,
  categoryFilter: string,
  instruction: string,
  retryInstruction: string,
  exclusionStr: string,
  allowedSubcategories: string,
) => `
    USA GOOGLE SEARCH. Cerca ${needed} luoghi REALI a ${cityName} (Cat: "${categoryFilter}").
    ${instruction} ${exclusionStr}
    OUTPUT JSON: [{ "name": "...", "category": "...", ... }]
`;

export const buildRegeneratePoiPrompt = (poiName: string, cityName: string) => `
    BONIFICA DATI: "${poiName}" a "${cityName}".
    Cerca info reali (Sito, Tel, Orari).
    OUTPUT JSON COMPLETO.
`;

export const buildSuggestItemsPrompt = (
  cityName: string,
  type: string,
  count: number,
  contextQuery: string,
  exclusionStr: string,
  allowedSubcategories: string,
) => {
  const tourOperatorSchema =
    type === 'tour_operators'
      ? `
    SCHEMA tour_operators (OBBLIGATORIO per ogni elemento):
    { "name": "...", "phone": "...", "website": "...", "email": "...", "address": "...", "description": "..." }
    NON usare i campi "contact" o "url". Usa SOLO "phone" e "website" per i contatti.
    `
      : '';

  const servicesSchema =
    type === 'services'
      ? `
    SCHEMA services (SOLO servizi utilitari — NO tour operator, NO agenzie viaggio):
    { "name": "...", "type": "...", "contact": "...", "url": "...", "address": "...", "description": "...", "category": "..." }
    `
      : '';

  return `
    esperto di "${cityName}".
    Trova ${count} elementi reali per "${type}".
    ${contextQuery ? `CONTESTO: "${contextQuery}"` : ''}
    ${exclusionStr}
    ${tourOperatorSchema}
    ${servicesSchema}
    OUTPUT JSON ARRAY.
    `;
};

export const buildRefineServicePrompt = (cityName: string, draftData: Record<string, unknown>) => `
    DATA MANAGER. Città: ${cityName}.
    Unisci e bonifica.
    INPUT: ${JSON.stringify(draftData)}
    SCHEMA OUTPUT OBBLIGATORIO:
    - guides: [{ name, isOfficial, languages, specialties, email, phone, website, ... }]
    - events: [{ name, date, category, description, location, coords, ... }]
    - tour_operators: [{ name, phone, website, email, address, description }]
      NON usare "contact" o "url" per tour_operators — SOLO "phone" e "website".
    - services: [{ name, type, contact, url, address, description, category }]
      SOLO servizi utilitari (trasporti, emergenza, info, ecc.). NO tour operator, NO agenzie viaggio.
    OUTPUT JSON: { "guides": [], "events": [], "tour_operators": [], "services": [] }
`;

// --- PERSONE & CULTURA ---

const PEOPLE_JSON_SCHEMA_HINT = `
SCHEMA JSON OBBLIGATORIO (ogni personaggio):
{
  "name": "string",
  "bio": "string",
  "specificCategorySlugs": ["slug_specifica_attiva", "..."],
  "birthYear": 1900,
  "birthDate": "1900-01-15" | null,
  "isLiving": false,
  "deathYear": 1980 | null,
  "deathDate": "1980-05-02" | null,
  "quote": "string opzionale",
  "fullBio": "string opzionale",
  "famousWorks": [],
  "relatedPlaces": []
}
REGOLE:
- Usa SOLO slug presenti nello STANDARD CATEGORIE sotto; non inventare slug.
- Niente campo "role".
- birthYear obbligatorio; se isLiving=false allora deathYear obbligatorio; se isLiving=true niente morte.
- birthDate/deathDate opzionali in formato YYYY-MM-DD e coerenti con l'anno.
`;

/** Sentinels: proteggono i slot placeholder mentre si rimuovono blocchi legacy. */
const PEOPLE_CATEGORIES_SENTINEL = '\u0000__PEOPLE_CATEGORIES_BLOCK__\u0000';
const PEOPLE_SCHEMA_SENTINEL = '\u0000__PEOPLE_SCHEMA_HINT__\u0000';

/** Header di blocco categorie riconosciuti in modo sicuro (inizio riga). Più lunghi prima. */
const PEOPLE_LEGACY_CATEGORIES_HEADERS = [
  'STANDARD CATEGORIE (slug ammessi):',
  'STANDARD CATEGORIE:',
] as const;

/** Header di blocco schema riconosciuto in modo sicuro (inizio riga). */
const PEOPLE_LEGACY_SCHEMA_HEADER = 'SCHEMA JSON OBBLIGATORIO';

/**
 * Stop affidabili a inizio riga (mai substring mid-line).
 * `OUTPUT JSON ARRAY` è il cue usato dai template reali; non usare il generico "OUTPUT JSON".
 */
const PEOPLE_LEGACY_OUTPUT_CUE = 'OUTPUT JSON ARRAY';

function indexOfLineStartMarker(text: string, marker: string, from = 0): number {
  let searchFrom = from;
  while (searchFrom <= text.length) {
    const idx = text.indexOf(marker, searchFrom);
    if (idx === -1) return -1;
    if (idx === 0 || text.charAt(idx - 1) === '\n') return idx;
    searchFrom = idx + marker.length;
  }
  return -1;
}

/** Prima occorrenza di uno stop marker **a inizio riga** dopo `from`; null se nessuno. */
function findEarliestStop(
  text: string,
  from: number,
  stopMarkers: readonly string[],
): number | null {
  let end: number | null = null;
  for (const stop of stopMarkers) {
    const idx = indexOfLineStartMarker(text, stop, from);
    if (idx !== -1 && (end === null || idx < end)) end = idx;
  }
  return end;
}

/**
 * True se resta un header contratto a inizio riga senza stop affidabile successivo.
 * Il blocco non è rimovibile in sicurezza (mai EOF come delimitatore).
 */
function hasUndelimitedLegacyContractBlock(
  text: string,
  headers: readonly string[],
  stopMarkers: readonly string[],
): boolean {
  for (const header of headers) {
    let searchFrom = 0;
    for (let i = 0; i < 32; i++) {
      const start = indexOfLineStartMarker(text, header, searchFrom);
      if (start === -1) break;
      const blockEnd = findEarliestStop(text, start + header.length, stopMarkers);
      if (blockEnd === null) return true;
      searchFrom = start + header.length;
    }
  }
  return false;
}

/**
 * Rimuove un blocco contratto People Discovery **solo** se:
 * - `startMarker` è a inizio riga;
 * - esiste uno stop marker successivo **a inizio riga** che delimita la fine.
 *
 * Se lo stop manca: non cancella nulla (nessun fallback a EOF).
 * Non rimuove occorrenze mid-line / in prosa.
 */
function stripPeopleDiscoveryMarkedBlocks(
  text: string,
  startMarker: string,
  stopMarkers: readonly string[],
): string {
  let result = text;
  let searchFrom = 0;
  for (let i = 0; i < 32; i++) {
    const start = indexOfLineStartMarker(result, startMarker, searchFrom);
    if (start === -1) break;
    const end = findEarliestStop(result, start + startMarker.length, stopMarkers);
    if (end === null) {
      searchFrom = start + startMarker.length;
      continue;
    }
    result = `${result.slice(0, start)}${result.slice(end)}`;
    searchFrom = start;
  }
  return result;
}

function stripLegacyPeopleCategoriesBlocks(text: string, stopMarkers: readonly string[]): string {
  let result = text;
  for (const header of PEOPLE_LEGACY_CATEGORIES_HEADERS) {
    result = stripPeopleDiscoveryMarkedBlocks(result, header, stopMarkers);
  }
  return result;
}

/**
 * Inietta taxonomy + schema JSON People Discovery nel prompt finale.
 *
 * Contratto Production (setting + fallback): `{categoriesBlock}` e `{schemaHint}`.
 * Garantisce categoriesBlock / PEOPLE_JSON_SCHEMA_HINT runtime quando:
 * - i placeholder sono presenti (sostituzione diretta), oppure
 * - non restano header legacy a inizio riga, oppure
 * - i blocchi legacy erano delimitati e sono stati rimossi integralmente.
 *
 * Legacy delimitato (formato reale: categorie → schema → `OUTPUT JSON ARRAY` a inizio riga):
 * strip integrale, poi blocco canonico.
 *
 * Legacy **non** delimitabile (nessuno stop a inizio riga): testo lasciato intatto;
 * **non** si appende il blocco canonico corrispondente — evita due contratti concorrenti
 * nel prompt. Normalizzazione completa richiede migrazione al template con placeholder.
 * Mai cancellazione fino a EOF.
 *
 * La garanzia applicativa anti-slug inventati resta `validateAiSpecificSlugs` a import.
 */
export function mergePeopleSuggestPromptContract(params: {
  template: string;
  cityName: string;
  count: number;
  contextStr: string;
  exclusionStr: string;
  categoriesBlock: string;
  schemaHint: string;
}): string {
  // Trim: evita che leading/trailing newline del blocco collidano con normalizzazione `\n{3,}`.
  const categoriesBlock = params.categoriesBlock.trim();
  const schemaHint = params.schemaHint.trim();

  let tpl = params.template;
  const hadCategoriesPlaceholder = tpl.includes('{categoriesBlock}');
  const hadSchemaPlaceholder = tpl.includes('{schemaHint}');

  // 1) Proteggi i placeholder contratto prima di ogni altra manipolazione.
  if (hadCategoriesPlaceholder) {
    tpl = tpl.replaceAll('{categoriesBlock}', PEOPLE_CATEGORIES_SENTINEL);
  }
  if (hadSchemaPlaceholder) {
    tpl = tpl.replaceAll('{schemaHint}', PEOPLE_SCHEMA_SENTINEL);
  }

  // 2) Variabili di contesto.
  tpl = tpl
    .replaceAll('{cityName}', params.cityName)
    .replaceAll('{count}', String(params.count))
    .replaceAll('{contextStr}', params.contextStr)
    .replaceAll('{exclusionStr}', params.exclusionStr);

  // 3) Legacy: strip solo blocchi chiaramente delimitati (stop a inizio riga).
  const categoryStopMarkers = [
    PEOPLE_LEGACY_SCHEMA_HEADER,
    PEOPLE_LEGACY_OUTPUT_CUE,
    PEOPLE_SCHEMA_SENTINEL,
    PEOPLE_CATEGORIES_SENTINEL,
  ] as const;
  const schemaStopMarkers = [
    ...PEOPLE_LEGACY_CATEGORIES_HEADERS,
    PEOPLE_LEGACY_OUTPUT_CUE,
    PEOPLE_CATEGORIES_SENTINEL,
    PEOPLE_SCHEMA_SENTINEL,
  ] as const;

  tpl = stripLegacyPeopleCategoriesBlocks(tpl, categoryStopMarkers);
  tpl = stripPeopleDiscoveryMarkedBlocks(tpl, PEOPLE_LEGACY_SCHEMA_HEADER, schemaStopMarkers);

  const legacyCategoriesUndelimited = hasUndelimitedLegacyContractBlock(
    tpl,
    PEOPLE_LEGACY_CATEGORIES_HEADERS,
    categoryStopMarkers,
  );
  const legacySchemaUndelimited = hasUndelimitedLegacyContractBlock(
    tpl,
    [PEOPLE_LEGACY_SCHEMA_HEADER],
    schemaStopMarkers,
  );

  // 4) Canonico: placeholder → replace; senza placeholder → append solo se nessun legacy
  //    non delimitabile restante per quello slot (evita doppio contratto nel prompt).
  if (hadCategoriesPlaceholder) {
    tpl = tpl.replaceAll(PEOPLE_CATEGORIES_SENTINEL, categoriesBlock);
  } else if (!legacyCategoriesUndelimited && !tpl.includes(categoriesBlock)) {
    tpl = `${tpl.trimEnd()}\n\n${categoriesBlock}`;
  }

  if (hadSchemaPlaceholder) {
    tpl = tpl.replaceAll(PEOPLE_SCHEMA_SENTINEL, schemaHint);
  } else if (!legacySchemaUndelimited && !tpl.includes(schemaHint)) {
    tpl = `${tpl.trimEnd()}\n\n${schemaHint}`;
  }

  return tpl.replace(/\n{3,}/g, '\n\n').trim();
}

export const buildSuggestPeoplePrompt = (
  cityName: string,
  count: number,
  existingNames: string[] = [],
  contextQuery: string = '',
  categoriesPrompt: string = '',
) => {
  const exclusionStr =
    existingNames.length > 0 ? `ESCLUDI TASSATIVAMENTE: ${existingNames.join(', ')}` : '';
  const contextStr = contextQuery ? `FOCUS UTENTE: "${contextQuery}"` : '';
  const categoriesBlock =
    categoriesPrompt.trim().length > 0
      ? `STANDARD CATEGORIE (slug ammessi):\n${categoriesPrompt}`
      : 'STANDARD CATEGORIE: (non disponibile — non inventare slug)';

  const fallback = `TASK: Trova {count} personaggi famosi legati a {cityName}.
    {contextStr} {exclusionStr}
    {categoriesBlock}
    {schemaHint}
    OUTPUT JSON ARRAY.`;

  const tpl = getTemplate(SETTINGS_KEYS.PROMPT_PEOPLE_SUGGEST, fallback);
  const merged = mergePeopleSuggestPromptContract({
    template: tpl,
    cityName,
    count,
    contextStr,
    exclusionStr,
    categoriesBlock,
    schemaHint: PEOPLE_JSON_SCHEMA_HINT,
  });

  return `${SYSTEM_PEOPLE_HEADER}\n${merged}`;
};

export const buildEnrichPersonPrompt = (
  personName: string,
  cityName: string,
  categoriesPrompt: string = '',
) => {
  const categoriesBlock =
    categoriesPrompt.trim().length > 0
      ? `STANDARD CATEGORIE (slug ammessi):\n${categoriesPrompt}`
      : 'STANDARD CATEGORIE: (non disponibile — non inventare slug)';

  return `
    ${SYSTEM_PEOPLE_HEADER}
    CITTÀ: ${cityName}
    PERSONAGGIO: ${personName}
    ${categoriesBlock}
    OBIETTIVO: Bonifica totale dati. Categorie dallo standard, date strutturate, bio estesa (TITOLO: ...\\nTesto), luoghi correlati.
    ${PEOPLE_JSON_SCHEMA_HINT}
    OUTPUT JSON UNICO (stesso schema, senza array wrapper).
`;
};

/** Completamento mirato dei soli campi testuali obbligatori mancanti (name|bio). */
export const buildCompletePersonFieldsPrompt = (
  personName: string,
  cityName: string,
  missingFields: readonly ('name' | 'bio')[],
  knownContext: {
    name?: string;
    bio?: string;
  },
) => {
  const fieldHints: Record<'name' | 'bio', string> = {
    name: 'name: nome completo del personaggio',
    bio: 'bio: biografia breve (2-4 frasi, stringa non vuota)',
  };
  const requested = missingFields.map((f) => `- ${fieldHints[f]}`).join('\n');
  const known = [
    knownContext.name ? `Nome noto: ${knownContext.name}` : null,
    knownContext.bio ? `Bio nota: ${knownContext.bio}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `${SYSTEM_PEOPLE_HEADER}
CITTÀ: ${cityName}
PERSONAGGIO: ${personName}
CONTESTO GIÀ NOTO:
${known || '(nessun altro campo disponibile)'}
OBIETTIVO: Completa SOLO i campi mancanti elencati. Non inventare campi non richiesti. Non restituire stringhe vuote. Non usare "role".
CAMPI RICHIESTI:
${requested}
OUTPUT JSON UNICO con esclusivamente le chiavi richieste.`;
};

/** Recupero mirato delle date strutturate (azione Admin / recovery pipeline). */
export const buildRecoverPersonDatesPrompt = (
  personName: string,
  cityName: string,
  knownContext: {
    name?: string;
    bio?: string;
    birthYear?: number | null;
    birthDate?: string | null;
    isLiving?: boolean;
    deathYear?: number | null;
    deathDate?: string | null;
  } = {},
) => {
  const known = [
    knownContext.name ? `Nome noto: ${knownContext.name}` : null,
    knownContext.bio ? `Bio nota: ${knownContext.bio}` : null,
    typeof knownContext.birthYear === 'number' ? `birthYear noto: ${knownContext.birthYear}` : null,
    knownContext.birthDate ? `birthDate nota: ${knownContext.birthDate}` : null,
    typeof knownContext.isLiving === 'boolean' ? `isLiving noto: ${knownContext.isLiving}` : null,
    typeof knownContext.deathYear === 'number' ? `deathYear noto: ${knownContext.deathYear}` : null,
    knownContext.deathDate ? `deathDate nota: ${knownContext.deathDate}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `${SYSTEM_PEOPLE_HEADER}
CITTÀ: ${cityName}
PERSONAGGIO: ${personName}
CONTESTO GIÀ NOTO:
${known || '(nessun altro campo disponibile)'}
OBIETTIVO: Recupera SOLO le date strutturate verificate. Non inventare biografie o categorie.
REGOLE: birthYear obbligatorio; se isLiving=false → deathYear obbligatorio; se isLiving=true → deathYear/deathDate null; date ISO YYYY-MM-DD opzionali e coerenti con l'anno.
OUTPUT JSON UNICO:
{
  "birthYear": number,
  "birthDate": "YYYY-MM-DD" | null,
  "isLiving": boolean,
  "deathYear": number | null,
  "deathDate": "YYYY-MM-DD" | null
}`;
};

// CITY GENERATION PROMPTS (Use DB Cache where possible)
export const buildCityGeneralPrompt = (
  cityName: string,
  baseContext: string,
  existingZones: string[],
) => {
  const tpl = getTemplate(
    'prompt_city_general',
    `
    ${baseContext}
    Analizza "${cityName}".
    ZONE UFFICIALI: [${existingZones.join(', ')}]
    Assegna la zona corretta.
    OUTPUT JSON: { "description": "...", "subtitle": "...", "zone": "...", "coords": ... }
    `,
  );
  return tpl.replace('{cityName}', cityName);
};

export const buildCityStatsPrompt = (cityName: string, baseContext: string) => `
    ${baseContext}
    Stima dati turistici ${cityName}.
    OUTPUT JSON: { "visitorsEstimate": 100000, "seasonalVisitors": { ... } }
`;

export const buildCityHistoryPrompt = (cityName: string, baseContext: string) => `
    ${baseContext}
    Storia di ${cityName}.
    OUTPUT JSON: { "historySnippet": "...", "historyFull": "..." }
`;

export const buildCityRatingsPrompt = (cityName: string, baseContext: string) => `
    ${baseContext}
    Valuta ${cityName} (0-100).
    OUTPUT JSON: { "ratings": { "cultura": 50, ... } }
`;

export const buildCityPatronPrompt = (cityName: string, baseContext: string) => `
    ${baseContext}
    Santo Patrono di ${cityName}.
    OUTPUT JSON: { "patron": { "name": "...", "date": "...", "history": "..." } }
`;

export const buildPlannerItineraryPrompt = (
  destination: string,
  style: string,
  daysCount: number,
  preferences: string,
  dailyInstructions: string,
  dbSourceList: string,
) => `
    ITINERARIO ${daysCount} GIORNI A ${destination}.
    STILE: ${style}. PREF: "${preferences}".
    LOGISTICA: ${dailyInstructions}
    DB SOURCE: ${dbSourceList}
    OUTPUT JSON ARRAY.
`;

export const buildPlannerRoadbookPrompt = (cityName: string, scheduleJson: string) => `
    ROADBOOK PER ${cityName}.
    ITINERARIO: ${scheduleJson}
    OUTPUT JSON ARRAY (RoadbookDay).
`;

export const buildPlannerModifyPrompt = (
  destination: string,
  planSummary: string,
  userRequest: string,
  dbAlternatives: string,
) => `
    MODIFICA ITINERARIO ${destination}.
    PIANO: ${planSummary}
    RICHIESTA: "${userRequest}"
    ALT: ${dbAlternatives}
    OUTPUT JSON: { "updatedPlan": [...], "chatReply": "..." }
`;

export const buildImageCaptionPrompt = () => 'Analizza immagine. Didascalia turistica breve.';
export const buildTipIllustrationPrompt = (text: string) =>
  `Illustrazione vettoriale minimalista, flat design dark mode: "${text}"`;
export const buildImageSafetyPrompt = () =>
  `Check Nudo/Violenza/Spam. JSON: { "isSafe": boolean, "reason": "..." }`;
