import { CitySummary, Itinerary } from '@/types';

/**
 * Striscia "bandiera" dell'header del Diario.
 *
 * L'header colora una sottile barra orizzontale con i colori della bandiera della nazione
 * dei POI presenti nel diario. I dati nazione sono già disponibili (`CitySummary.nation`),
 * derivati dal `cityId` di ciascuna tappa tramite il `cityManifest`: qui non si tocca DB né
 * modello dati, si aggiunge solo la mappa di presentazione nazione → colori.
 *
 * I tre colori sono i segmenti sinistra→destra della barra. Per le bandiere non tricolori
 * usiamo una resa stilizzata a 3 fasce rappresentativa (è un accento grafico da 4px, non una
 * riproduzione fedele). Default: Italia.
 */
type FlagColors = readonly [string, string, string];

const ITALY_FLAG: FlagColors = ['#009246', '#ffffff', '#ce2b37'];

/** Chiave = nome nazione normalizzato (lowercase). Inclusi alias EN per robustezza. */
const FLAG_COLORS_BY_NATION: Record<string, FlagColors> = {
  italia: ITALY_FLAG,
  italy: ITALY_FLAG,
  francia: ['#0055a4', '#ffffff', '#ef4135'],
  france: ['#0055a4', '#ffffff', '#ef4135'],
  spagna: ['#aa151b', '#f1bf00', '#aa151b'],
  spain: ['#aa151b', '#f1bf00', '#aa151b'],
  españa: ['#aa151b', '#f1bf00', '#aa151b'],
  germania: ['#000000', '#dd0000', '#ffce00'],
  germany: ['#000000', '#dd0000', '#ffce00'],
  belgio: ['#000000', '#fdda24', '#ef3340'],
  belgium: ['#000000', '#fdda24', '#ef3340'],
  irlanda: ['#169b62', '#ffffff', '#ff883e'],
  ireland: ['#169b62', '#ffffff', '#ff883e'],
  romania: ['#002b7f', '#fcd116', '#ce1126'],
  paesibassi: ['#ae1c28', '#ffffff', '#21468b'],
  olanda: ['#ae1c28', '#ffffff', '#21468b'],
  netherlands: ['#ae1c28', '#ffffff', '#21468b'],
  austria: ['#ed2939', '#ffffff', '#ed2939'],
  svizzera: ['#d52b1e', '#ffffff', '#d52b1e'],
  switzerland: ['#d52b1e', '#ffffff', '#d52b1e'],
  portogallo: ['#006600', '#006600', '#ff0000'],
  portugal: ['#006600', '#006600', '#ff0000'],
  grecia: ['#0d5eaf', '#ffffff', '#0d5eaf'],
  greece: ['#0d5eaf', '#ffffff', '#0d5eaf'],
  regnounito: ['#012169', '#ffffff', '#c8102e'],
  unitedkingdom: ['#012169', '#ffffff', '#c8102e'],
  uk: ['#012169', '#ffffff', '#c8102e'],
};

const normalizeNation = (nation: string): string =>
  nation
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // rimuove accenti
    .replace(/[\s'._-]/g, ''); // "Regno Unito" -> "regnounito", "Paesi Bassi" -> "paesibassi"

/** Colori bandiera per una nazione; default Italia per nazioni sconosciute o assenti. */
export const getNationFlagColors = (nation?: string | null): FlagColors => {
  if (!nation) return ITALY_FLAG;
  return FLAG_COLORS_BY_NATION[normalizeNation(nation)] ?? ITALY_FLAG;
};

/** Costruisce il CSS `linear-gradient` (stop netti) per la barra header. */
export const buildFlagGradient = (colors: FlagColors): string =>
  `linear-gradient(to right, ${colors[0]} 0 33.333%, ${colors[1]} 33.333% 66.666%, ${colors[2]} 66.666% 100%)`;

/**
 * Nazione "dominante" tra i POI del diario: la più frequente in base al `cityId` delle tappe,
 * risolta tramite il `cityManifest`. Le tappe custom (senza città reale) sono ignorate.
 * Restituisce `null` se non c'è alcuna città risolvibile (l'header userà il default).
 */
export const getDiaryNation = (
  itinerary: Itinerary,
  cityManifest?: CitySummary[]
): string | null => {
  if (!cityManifest || cityManifest.length === 0) return null;
  const items = itinerary.items;
  if (!items || items.length === 0) return null;

  // Preferiamo `nation_slug` (identificatore più stabile del nome di presentazione) e ripieghiamo
  // sul nome solo se lo slug manca. Entrambi confluiscono nella stessa normalizzazione.
  const cityNationById = new Map<string, string>();
  for (const city of cityManifest) {
    if (!city?.id) continue;
    const nationKey = city.nation_slug || city.nation;
    if (nationKey) cityNationById.set(String(city.id), nationKey);
  }

  const counts = new Map<string, number>();
  for (const item of items) {
    const cityId = item.cityId ?? item.poi?.cityId;
    if (!cityId || cityId === 'custom' || cityId === 'unknown') continue;
    const nation = cityNationById.get(String(cityId));
    if (!nation) continue;
    counts.set(nation, (counts.get(nation) ?? 0) + 1);
  }

  let topNation: string | null = null;
  let topCount = 0;
  for (const [nation, count] of counts) {
    if (count > topCount) {
      topCount = count;
      topNation = nation;
    }
  }
  return topNation;
};

/** Gradient pronto per l'header del Diario in base ai POI presenti. */
export const getDiaryFlagGradient = (
  itinerary: Itinerary,
  cityManifest?: CitySummary[]
): string => buildFlagGradient(getNationFlagColors(getDiaryNation(itinerary, cityManifest)));
