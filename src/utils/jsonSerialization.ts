import type {
  AffiliateLinks,
  LinkMetadata,
  MediaAsset,
  OpeningHours,
  PatronDetails,
} from '../types/index';
import type { Json } from '../types/supabase';

/**
 * UTILITY DI SERIALIZZAZIONE JSON — src/utils/jsonSerialization.ts
 *
 * Queste utility garantiscono che i tipi semantici del dominio (OpeningHours, AffiliateLinks, etc.)
 * vengano convertiti in strutture dati compatibili con il tipo Json di Supabase
 * in modo ESPLICITO e TYPE-SAFE, senza ricorrere a cast 'as any'.
 */

/**
 * Serializza OpeningHours in un oggetto JSON-safe per Supabase.
 */
export const serializeOpeningHours = (oh: OpeningHours | null | undefined): Json => {
  if (!oh) return null;
  return {
    days: oh.days,
    morning: oh.morning,
    afternoon: oh.afternoon,
    evening: oh.evening,
    isEstimated: oh.isEstimated,
  };
};

/**
 * Serializza AffiliateLinks in un oggetto JSON-safe per Supabase.
 */
export const serializeAffiliateLinks = (links: AffiliateLinks | null | undefined): Json => {
  if (!links) return null;
  return {
    booking: links.booking,
    tripadvisor: links.tripadvisor,
    getyourguide: links.getyourguide,
    thefork: links.thefork,
    michelin: links.michelin,
    airbnb: links.airbnb,
    skyscanner: links.skyscanner,
    ferryscanner: links.ferryscanner,
  };
};

/**
 * Serializza un record di LinkMetadata in un oggetto JSON-safe per Supabase.
 */
export const serializeLinkMetadataRecord = (
  record: Record<string, LinkMetadata> | null | undefined,
): Json => {
  if (!record) return null;

  const result: Record<string, Json> = {};

  Object.entries(record).forEach(([key, metadata]) => {
    result[key] = {
      verified: metadata.verified,
      excluded: metadata.excluded,
    };
  });

  return result;
};

/**
 * Serializza PatronDetails in un oggetto JSON-safe per Supabase.
 * Solo i campi persistiti su `patron_details` JSON (imageUrl città propria — nessun Master fallback).
 */
export const serializePatronDetails = (pd: PatronDetails | null | undefined): Json => {
  if (!pd) return null;

  const result: { [key: string]: Json | undefined } = {
    name: pd.name,
    date: pd.date,
    history: pd.history,
    imageUrl: pd.imageUrl ?? null,
    image_status: pd.image_status ?? null,
  };
  return result;
};

/**
 * Serializza i ratings (Record<string, number>) in un oggetto JSON-safe.
 */
export const serializeRatings = (ratings: Record<string, number> | null | undefined): Json => {
  if (!ratings) return null;

  const result: { [key: string]: Json | undefined } = {};
  for (const [key, value] of Object.entries(ratings)) {
    result[key] = value;
  }
  return result;
};

/**
 * Serializza la galleria (MediaAsset[]) in un array JSON-safe.
 */
export const serializeGallery = (gallery: MediaAsset[] | null | undefined): Json => {
  if (!gallery) return null;
  return gallery.map((asset) => ({
    url: asset.url,
    mediaStatus: asset.mediaStatus,
  }));
};

/**
 * Serializza gli array di stringhe (es: generation_logs) in un array JSON-safe.
 */
export const serializeStringArray = (arr: string[] | null | undefined): Json => {
  if (!arr) return null;
  const result: Json[] = [...arr];
  return result;
};
