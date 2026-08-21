import { useConfig } from '@/context/ConfigContext';
import { SETTINGS_KEYS } from '@/services/settingsService';

/** Patrono Master da `global_settings.default_patron_image` (ConfigContext SoT). */
export function usePatronMasterImageUrl(): string {
  const { configs } = useConfig();
  const raw = configs[SETTINGS_KEYS.DEFAULT_PATRON_IMAGE];
  return typeof raw === 'string' ? raw.trim() : '';
}
