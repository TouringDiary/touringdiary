/**
 * Contratto payload drop del Diario.
 * Esecuzione: npx tsx --tsconfig tsconfig.app.json scripts/smoke-diary-drop-payload.ts
 */
import {
  isDiaryMoveDragPayload,
  parseDiaryDropPointOfInterest,
} from '../src/domain/diary/diaryDropPayload';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

/**
 * Riga reale `pois` (city_torre-del-greco).
 * `sub_category` = `palazzo`, assente da `POI_SUBCATEGORY_VALUES` (l'enum ha `palace`).
 * Il fixture non porta `subCategorySource`: deve crearlo il parser.
 */
const villaEnricoDeNicola = {
  id: 'draft_1769263634701_2u4ue6',
  name: 'Villa Enrico De Nicola',
  description:
    'Dimora storica e ultima residenza del primo Presidente della Repubblica Italiana, Enrico De Nicola.',
  category: 'monument',
  subCategory: 'palazzo',
  cityId: 'city_torre-del-greco',
};

const parsedVilla = parseDiaryDropPointOfInterest(villaEnricoDeNicola);
assert(parsedVilla !== null, 'Villa Enrico De Nicola accettata');
assert(parsedVilla?.id === villaEnricoDeNicola.id, 'id');
assert(parsedVilla?.name === villaEnricoDeNicola.name, 'name');
assert(parsedVilla?.description === villaEnricoDeNicola.description, 'description');
assert(parsedVilla?.category === 'monument', 'category monument');
assert(parsedVilla?.cityId === 'city_torre-del-greco', 'cityId');
assert(parsedVilla?.subCategory === undefined, 'palazzo non resta su subCategory');
assert(parsedVilla?.subCategorySource === 'palazzo', 'palazzo viene scritto su subCategorySource');

const roundTrip: unknown = JSON.parse(JSON.stringify(villaEnricoDeNicola));
const parsedRoundTrip = parseDiaryDropPointOfInterest(roundTrip);
assert(parsedRoundTrip?.subCategory === undefined, 'round-trip: subCategory enum assente');
assert(parsedRoundTrip?.subCategorySource === 'palazzo', 'round-trip: subCategorySource');

/** Fixture di contratto: `square` è una sottocategoria enum reale. L'id non è una riga DB. */
const inEnum = {
  id: 'poi-in-enum',
  name: 'POI',
  description: '',
  category: 'monument',
  subCategory: 'square',
  cityId: 'city_torre-del-greco',
};
const parsedEnum = parseDiaryDropPointOfInterest(inEnum);
assert(parsedEnum?.subCategory === 'square', 'subCategory nell enum resta sul campo');
assert(parsedEnum?.subCategorySource === undefined, 'nessuno spostamento se il valore è nell enum');

assert(
  parseDiaryDropPointOfInterest({ ...inEnum, category: 'service' }) === null,
  'category service non è PoiCategory',
);
assert(
  parseDiaryDropPointOfInterest({ ...inEnum, category: 'not-a-category' }) === null,
  'category ignota',
);
assert(
  parseDiaryDropPointOfInterest({ ...inEnum, description: null }) === null,
  'description null',
);
assert(parseDiaryDropPointOfInterest({ ...inEnum, id: '' }) === null, 'id vuoto');
assert(
  parseDiaryDropPointOfInterest({ ...inEnum, subCategory: 4 }) === null,
  'subCategory non stringa',
);
assert(parseDiaryDropPointOfInterest({ ...inEnum, cityId: 12 }) === null, 'cityId non stringa');
assert(
  parseDiaryDropPointOfInterest({ ...inEnum, resourceType: 'hotel' }) === null,
  'resourceType ignoto',
);

const move = { type: 'MOVE_ITEM', id: 'item-1' };
assert(isDiaryMoveDragPayload(move), 'MOVE_ITEM');
assert(parseDiaryDropPointOfInterest(move) === null, 'MOVE_ITEM non è un POI');
assert(!isDiaryMoveDragPayload(villaEnricoDeNicola), 'POI non è MOVE_ITEM');

console.log('smoke-diary-drop-payload: PASS');
