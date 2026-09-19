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

  for (const { bucket, marker } of BUCKET_MARKERS) {
    const idx = trimmed.indexOf(marker);
    if (idx === -1) continue;
    const path = decodeURIComponent(trimmed.slice(idx + marker.length).split('?')[0] ?? '');
    if (path.length > 0) {
      return { storageBucket: bucket, storagePath: path };
    }
  }

  return null;
}
