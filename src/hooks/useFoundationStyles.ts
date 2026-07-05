import { useDynamicStyles } from '@/hooks/useDynamicStyles';
import type { FoundationStyleKey } from '@/data/system/foundationSettingsCatalog';

/**
 * Legge una regola Foundation dal Design System runtime.
 * Wrapper tipizzato attorno a useDynamicStyles — nessun valore hardcoded.
 */
export function useFoundationStyles(
  componentKey: FoundationStyleKey | string,
  isMobile = false
): string {
  return useDynamicStyles(componentKey, isMobile);
}
