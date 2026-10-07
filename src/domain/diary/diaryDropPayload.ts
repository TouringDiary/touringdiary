import { POI_CATEGORY_VALUES, POI_SUBCATEGORY_VALUES } from '@/constants/governance';
import type { PoiCategory, PointOfInterest, PoiSubCategory } from '@/types/models/City';
import type { ContactInfo } from '@/types/shared/primitives';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export interface DiaryMoveDragPayload {
  type: 'MOVE_ITEM';
  id: string;
  forceSwap?: boolean;
}

export const isDiaryMoveDragPayload = (value: unknown): value is DiaryMoveDragPayload =>
  isPlainObject(value) &&
  value.type === 'MOVE_ITEM' &&
  typeof value.id === 'string' &&
  (value.forceSwap === undefined || typeof value.forceSwap === 'boolean');

const isPoiCategoryField = (value: unknown): value is PoiCategory => {
  if (typeof value !== 'string') return false;
  for (const category of POI_CATEGORY_VALUES) {
    if (category === value) return true;
  }
  return false;
};

const isPoiSubCategoryField = (value: string): value is PoiSubCategory => {
  for (const subCategory of POI_SUBCATEGORY_VALUES) {
    if (subCategory === value) return true;
  }
  return false;
};

const isResourceTypeField = (
  value: unknown,
): value is NonNullable<PointOfInterest['resourceType']> =>
  value === 'guide' || value === 'operator' || value === 'service';

const readString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const readCoords = (value: unknown): PointOfInterest['coords'] => {
  if (!isPlainObject(value)) return undefined;
  if (typeof value.lat !== 'number' || typeof value.lng !== 'number') return undefined;
  if (!Number.isFinite(value.lat) || !Number.isFinite(value.lng)) return undefined;
  return { lat: value.lat, lng: value.lng };
};

const readNullableString = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') return value;
  return undefined;
};

/**
 * `ContactInfo` ha solo campi opzionali: `{}` è un contatto senza dati, non un oggetto malformato.
 * `null` resta null. Un valore che non è un oggetto si omette.
 * Un campo presente ma non `string` né `null` resta assente.
 */
const readContactInfo = (value: unknown): ContactInfo | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!isPlainObject(value)) return undefined;
  return {
    phone: readNullableString(value.phone),
    email: readNullableString(value.email),
    whatsapp: readNullableString(value.whatsapp),
    website: readNullableString(value.website),
  };
};

/**
 * Producer: `JSON.stringify(poi)` del POI mappato (`CityGuide`, `ShowcaseCards`).
 * Obbligatori sul tipo e sul drop: id, name, description, category.
 * Il Diario legge anche cityId, resourceType, subCategory, imageUrl, address,
 * visitDuration, coords, contactInfo, updatedAt.
 * Il risultato è un `PointOfInterest` costruito solo con campi validati:
 * `subCategory` resta solo se è `PoiSubCategory`; il testo fuori enum va in `subCategorySource`.
 */
export const parseDiaryDropPointOfInterest = (value: unknown): PointOfInterest | null => {
  if (!isPlainObject(value)) return null;
  if (typeof value.id !== 'string' || value.id.length === 0) return null;
  if (typeof value.name !== 'string') return null;
  if (typeof value.description !== 'string') return null;
  if (!isPoiCategoryField(value.category)) return null;
  if (value.cityId !== undefined && typeof value.cityId !== 'string') return null;
  if (value.resourceType !== undefined && !isResourceTypeField(value.resourceType)) return null;

  const rawSubCategory = value.subCategory;
  if (
    rawSubCategory !== undefined &&
    (typeof rawSubCategory !== 'string' || rawSubCategory.length === 0)
  ) {
    return null;
  }

  const poi: PointOfInterest = {
    id: value.id,
    name: value.name,
    description: value.description,
    category: value.category,
  };

  if (typeof value.cityId === 'string') poi.cityId = value.cityId;
  if (isResourceTypeField(value.resourceType)) poi.resourceType = value.resourceType;

  if (typeof rawSubCategory === 'string' && isPoiSubCategoryField(rawSubCategory)) {
    poi.subCategory = rawSubCategory;
  }

  const sourceOnPayload = value.subCategorySource;
  if (typeof sourceOnPayload === 'string' || sourceOnPayload === null) {
    poi.subCategorySource = sourceOnPayload;
  } else if (typeof rawSubCategory === 'string' && !isPoiSubCategoryField(rawSubCategory)) {
    poi.subCategorySource = rawSubCategory;
  }

  const imageUrl = readString(value.imageUrl);
  if (imageUrl !== undefined) poi.imageUrl = imageUrl;
  const address = readString(value.address);
  if (address !== undefined) poi.address = address;
  const visitDuration = readString(value.visitDuration);
  if (visitDuration !== undefined) poi.visitDuration = visitDuration;
  const updatedAt = readString(value.updatedAt);
  if (updatedAt !== undefined) poi.updatedAt = updatedAt;

  const coords = readCoords(value.coords);
  if (coords) poi.coords = coords;

  const contactInfo = readContactInfo(value.contactInfo);
  if (contactInfo !== undefined) poi.contactInfo = contactInfo;

  return poi;
};
