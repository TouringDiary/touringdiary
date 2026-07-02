import type { PoiCategory } from '@/types/models/City';

export type PoiDisplayImageSource =
  | 'snapshot'
  | 'catalog'
  | 'category_placeholder'
  | 'none';

export interface ResolvePoiDisplayImageUrlParams {
  /** URL persistito nello snapshot / su PointOfInterest.imageUrl */
  imageUrl?: string | null;
  /** URL fresca dal catalogo (es. batch getPoisByIds in export) */
  catalogImageUrl?: string | null;
  category: PoiCategory | string;
  /** Mappa `category_placeholders` da global_settings */
  categoryPlaceholders?: Record<string, string> | null;
}

export interface ResolveCategoryPlaceholderUrlParams {
  category: PoiCategory | string;
  /** Mappa `category_placeholders` da global_settings */
  categoryPlaceholders?: Record<string, string> | null;
}

function trimUrl(url: string | null | undefined): string {
  return url?.trim() ?? '';
}

/** Risolve soltanto il placeholder immagine associato a una categoria POI. */
export function resolveCategoryPlaceholderUrl(
  params: ResolveCategoryPlaceholderUrlParams,
): string | undefined {
  const placeholders = params.categoryPlaceholders;
  if (!placeholders || typeof placeholders !== 'object') return undefined;

  const categoryUrl = trimUrl(placeholders[params.category]);
  return categoryUrl || undefined;
}

/**
 * Regola unica di business per l'immagine di display di un POI.
 * Priorità: snapshot → catalogo → placeholder di categoria.
 */
export function resolvePoiDisplayImageUrl(
  params: ResolvePoiDisplayImageUrlParams,
): string | undefined {
  const snapshot = trimUrl(params.imageUrl);
  if (snapshot) return snapshot;

  const catalog = trimUrl(params.catalogImageUrl);
  if (catalog) return catalog;

  return resolveCategoryPlaceholderUrl(params);
}

export function resolvePoiDisplayImageSource(
  params: ResolvePoiDisplayImageUrlParams,
): PoiDisplayImageSource {
  const snapshot = trimUrl(params.imageUrl);
  if (snapshot) return 'snapshot';

  const catalog = trimUrl(params.catalogImageUrl);
  if (catalog) return 'catalog';

  if (resolveCategoryPlaceholderUrl(params)) return 'category_placeholder';

  return 'none';
}
