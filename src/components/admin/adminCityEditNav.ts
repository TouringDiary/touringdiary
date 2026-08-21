/**
 * Deep-link leggero verso Edit Città nel Manager POI-DB.
 * Riutilizza la route esistente `/admin/cities` + stato locale `editingCityId`
 * (AdminDashboard) — nessun path nuovo.
 */
export const ADMIN_CITY_EDITOR_TABS = [
  'general',
  'ratings',
  'culture',
  'info',
  'media',
  'pois',
  'logs',
] as const;

export type AdminCityEditorTab = (typeof ADMIN_CITY_EDITOR_TABS)[number];

/** Tab "Storia" in AdminCityEditor (label UI: Storia, id: culture). */
export const ADMIN_CITY_TAB_STORIA: AdminCityEditorTab = 'culture';

export type AdminCityEditLocationState = {
  editCityId: string;
  editCityTab?: AdminCityEditorTab;
};

export function isAdminCityEditorTab(value: unknown): value is AdminCityEditorTab {
  return typeof value === 'string' && (ADMIN_CITY_EDITOR_TABS as readonly string[]).includes(value);
}

export function isAdminCityEditLocationState(value: unknown): value is AdminCityEditLocationState {
  if (typeof value !== 'object' || value === null) return false;
  if (!('editCityId' in value)) return false;
  const id = (value as { editCityId: unknown }).editCityId;
  if (typeof id !== 'string' || id.trim() === '') return false;
  if (!('editCityTab' in value) || (value as { editCityTab?: unknown }).editCityTab === undefined) {
    return true;
  }
  return isAdminCityEditorTab((value as { editCityTab: unknown }).editCityTab);
}

/** Target di navigazione per aprire Edit Città (+ tab opzionale). */
export function buildAdminCityEditTarget(
  cityId: string,
  tab: AdminCityEditorTab = ADMIN_CITY_TAB_STORIA,
): { pathname: '/admin/cities'; state: AdminCityEditLocationState } {
  return {
    pathname: '/admin/cities',
    state: { editCityId: cityId, editCityTab: tab },
  };
}
