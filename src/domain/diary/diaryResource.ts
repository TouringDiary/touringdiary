import type { PointOfInterest } from '@/types/models/City';

/**
 * Risorsa del Diario: footer / contatto, non tappa con conflitto orario.
 * Stessa regola per +ADD, drag, duplicate e scheda POI.
 * `leisure` + `agency` è il caso legacy senza `resourceType`.
 */
export const isDiaryResourcePoi = (poi: PointOfInterest): boolean =>
  poi.resourceType === 'guide' ||
  poi.resourceType === 'operator' ||
  poi.resourceType === 'service' ||
  (poi.category === 'leisure' && poi.subCategory === 'agency');
