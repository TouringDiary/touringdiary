import type { CitySummary } from '@/types';

/** Lookup dominio: CitySummary dal manifest (nessun parsing dell'id). */
export function findCityInManifest(
  cityId: string,
  manifest: CitySummary[],
): CitySummary | undefined {
  if (!cityId) return undefined;
  return manifest.find((c) => String(c.id) === String(cityId));
}

/** Header/cover città: hero se presente, altrimenti imageUrl di catalogo. */
export function cityHeaderImageUrl(city: CitySummary): string | null {
  const hero = city.heroImage?.trim();
  if (hero) return hero;
  const image = city.imageUrl?.trim();
  return image || null;
}
