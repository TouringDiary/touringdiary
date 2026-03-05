
import { getCachedSetting, SETTINGS_KEYS } from '../../services/settingsService';

// I template vengono ora recuperati dalla cache globale caricata all'avvio.
// Se mancano (es. primo avvio o offline), usiamo stringhe di fallback hardcoded qui.

const getTemplate = (key: string, fallback: string): string => {
    // Prova a leggere dalla cache settingsService
    const val = getCachedSetting<string>(key);
    return (val && val.length > 10) ? val : fallback;
};

export const SYSTEM_PRECISION_HEADER = `
RUOLO: Sei un Auditor Turistico Supremo e Geografo Esperto.
LINGUA: RISPONDI SEMPRE ED ESCLUSIVAMENTE IN ITALIANO.
OBIETTIVO: Validazione TOTALE dei dati (A-Z) e Coerenza Geografica.
`;

export const SYSTEM_PEOPLE_HEADER = `
RUOLO: Sei un Biografo Storico ed Esperto di Cultura Locale della Campania.
LINGUA: RISPONDI SEMPRE ED ESCLUSIVAMENTE IN ITALIANO.
OBIETTIVO: Fornire dati biografici precisi, date verificate e narrazioni coinvolgenti.
`;

export const buildCityAuditPrompt = (cityName: string) => {
    const tpl = getTemplate(SETTINGS_KEYS.PROMPT_CITY_AUDIT, `SEI UN AUDITOR TURISTICO PER "{cityName}". OBIETTIVO: Identificare i 15-20 "Must-See" POI. OUTPUT JSON ARRAY.`);
    return tpl.replace('{cityName}', cityName);
};

export const buildRegionalAnalysisPrompt = (regionName: string, existingZones: string[], minVisitors: number = 50000) => `
    SEI UN PIANIFICATORE TERRITORIALE STRATEGICO.
    Analizza la regione: "${regionName}".
    OBIETTIVO: Suddividere la regione in "Zone Turistiche".
    Filtro: min ${minVisitors} visitatori.
    ZONE ESISTENTI: ${JSON.stringify(existingZones)}
    OUTPUT JSON: { "region": "${regionName}", "zones": [{ "name": "...", "mainCities": [...] }] }
`;

export const buildZoneAnalysisPrompt = (zoneName: string, regionName: string, existingCities: string[], minVisitors: number = 5000) => `
    SEI UN ESPERTO DI GEOGRAFIA TURISTICA.
    ANALISI MICRO-ZONA: "${zoneName}" (${regionName}).
    COMPITO: Elenca TUTTE le città/borghi rilevanti.
    CRITERI: Stima > ${minVisitors} visitatori.
    FORMATO JSON OBBLIGATORIO:
    { "region": "${regionName}", "zones": [ { "name": "${zoneName}", "mainCities": [ { "name": "...", "visitors": 10000, "reason": "..." } ] } ] }
`;

export const buildVerifyPoisPrompt = (cityName: string, candidates: any[]) => `
    SEI UN AUDITOR DIGITALE.
    Città: "${cityName}".
    Verifica esistenza/orari.
    INPUT: ${JSON.stringify(candidates)}
    OUTPUT JSON ARRAY: [{ "id": 0, "status": "valid"|"invalid" ... }]
`;

export const buildSuggestNewPoisPrompt = (cityName: string, needed: number, categoryFilter: string, instruction: string, retryInstruction: string, exclusionStr: string, allowedSubcategories: string) => `
    USA GOOGLE SEARCH. Cerca ${needed} luoghi REALI a ${cityName} (Cat: "${categoryFilter}").
    ${instruction} ${exclusionStr}
    OUTPUT JSON: [{ "name": "...", "category": "...", ... }]
`;

export const buildRegeneratePoiPrompt = (poiName: string, cityName: string) => `
    BONIFICA DATI: "${poiName}" a "${cityName}".
    Cerca info reali (Sito, Tel, Orari).
    OUTPUT JSON COMPLETO.
`;

export const buildSuggestItemsPrompt = (cityName: string, type: string, count: number, contextQuery: string, exclusionStr: string, allowedSubcategories: string) => `
    esperto di "${cityName}".
    Trova ${count} elementi reali per "${type}".
    ${contextQuery ? `CONTESTO: "${contextQuery}"` : ''}
    ${exclusionStr}
    OUTPUT JSON ARRAY.
`;

export const buildRefineServicePrompt = (cityName: string, draftData: any) => `
    DATA MANAGER. Città: ${cityName}.
    Unisci e bonifica.
    INPUT: ${JSON.stringify(draftData)}
    OUTPUT JSON: { "guides": [], "events": [], "tour_operators": [], "services": [] }
`;

// --- PERSONE & CULTURA ---

export const buildSuggestPeoplePrompt = (
    cityName: string, 
    count: number, 
    existingNames: string[] = [],
    contextQuery: string = ''
) => {
    const exclusionStr = existingNames.length > 0 ? `ESCLUDI TASSATIVAMENTE: ${existingNames.join(', ')}` : '';
    const contextStr = contextQuery ? `FOCUS UTENTE: "${contextQuery}"` : '';

    const fallback = `TASK: Trova {count} personaggi famosi legati a {cityName}.
    {contextStr} {exclusionStr}
    REGOLA DATE: Formato "YYYY - YYYY" obbligatorio.
    OUTPUT JSON ARRAY.`;

    let tpl = getTemplate(SETTINGS_KEYS.PROMPT_PEOPLE_SUGGEST, fallback);
    
    // Replace vars
    tpl = tpl.replace('{cityName}', cityName)
             .replace('{count}', count.toString())
             .replace('{contextStr}', contextStr)
             .replace('{exclusionStr}', exclusionStr);
             
    return `${SYSTEM_PEOPLE_HEADER}\n${tpl}`;
};

export const buildEnrichPersonPrompt = (personName: string, cityName: string) => `
    ${SYSTEM_PEOPLE_HEADER}
    CITTÀ: ${cityName}
    PERSONAGGIO: ${personName}
    OBIETTIVO: Bonifica totale dati. Date esatte, bio estesa (TITOLO: ...\\nTesto), luoghi correlati.
    OUTPUT JSON UNICO.
`;

// CITY GENERATION PROMPTS (Use DB Cache where possible)
export const buildCityGeneralPrompt = (cityName: string, baseContext: string, existingZones: string[]) => {
    const tpl = getTemplate('prompt_city_general', `
    ${baseContext}
    Analizza "${cityName}".
    ZONE UFFICIALI: [${existingZones.join(', ')}]
    Assegna la zona corretta.
    OUTPUT JSON: { "description": "...", "subtitle": "...", "zone": "...", "coords": ... }
    `);
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

export const buildPlannerItineraryPrompt = (destination: string, style: string, daysCount: number, preferences: string, dailyInstructions: string, dbSourceList: string) => `
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

export const buildPlannerModifyPrompt = (destination: string, planSummary: string, userRequest: string, dbAlternatives: string) => `
    MODIFICA ITINERARIO ${destination}.
    PIANO: ${planSummary}
    RICHIESTA: "${userRequest}"
    ALT: ${dbAlternatives}
    OUTPUT JSON: { "updatedPlan": [...], "chatReply": "..." }
`;

export const buildImageCaptionPrompt = () => "Analizza immagine. Didascalia turistica breve.";
export const buildTipIllustrationPrompt = (text: string) => `Illustrazione vettoriale minimalista, flat design dark mode: "${text}"`;
export const buildImageSafetyPrompt = () => `Check Nudo/Violenza/Spam. JSON: { "isSafe": boolean, "reason": "..." }`;
