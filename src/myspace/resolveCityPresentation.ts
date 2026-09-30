import { resolveCityPresentation } from '@/domain/city/resolveCityHeroDisplayUrl';
import type { CitySummary } from '@/types';

/** Lookup dominio: CitySummary dal manifest (nessun parsing dell'id). */
export function findCityInManifest(
  cityId: string,
  manifest: CitySummary[],
): CitySummary | undefined {
  if (!cityId) return undefined;
  return manifest.find((c) => String(c.id) === String(cityId));
}

/** Header/cover città — usa hero risolto se presente nel summary. */
export function cityHeaderImageUrl(city: CitySummary): string | null {
  const { headerImageUrl } = resolveCityPresentation({
    resolvedHeroUrl: city.heroImage,
  });
  return headerImageUrl;
}
