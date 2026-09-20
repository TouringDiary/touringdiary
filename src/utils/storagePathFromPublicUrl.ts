import { supabase } from '@/services/supabaseClient';

const BUCKET_MARKERS: ReadonlyArray<{ bucket: string; marker: string }> = [
  { bucket: 'public-media', marker: '/object/public/public-media/' },
  { bucket: 'community-photos', marker: '/object/public/community-photos/' },
];

export type ParsedStorageLocation = {
  storageBucket: string;
  storagePath: string;
};

/** Estrae bucket + path da URL pubblico Supabase Storage (public-media, community-photos). */
export function parseStorageLocationFromPublicUrl(url: string): ParsedStorageLocation | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  const markerMatch = BUCKET_MARKERS.find(({ marker }) => parsed.pathname.includes(marker));
  if (!markerMatch) return null;

  const markerIndex = parsed.pathname.indexOf(markerMatch.marker);
  const rawPath = parsed.pathname.slice(markerIndex + markerMatch.marker.length);
  if (!rawPath) return null;

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    return null;
  }

  if (decodedPath.length === 0) return null;

  return { storageBucket: markerMatch.bucket, storagePath: decodedPath };
}

/** URL pubblico Storage da bucket + path (MF3 coda Admin). */
export function buildPublicStorageUrl(bucket: string, path: string): string | null {
  const cleanBucket = bucket.trim();
  const cleanPath = path.trim();
  if (!cleanBucket || !cleanPath) return null;
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) return cleanPath;
  const {
    data: { publicUrl },
  } = supabase.storage.from(cleanBucket).getPublicUrl(cleanPath);
  return publicUrl ?? null;
}
