import { useMemo } from 'react';
import { constructClassName, useDynamicStyles } from '@/hooks/useDynamicStyles';
import { MYWORLD_DESIGN_RULES } from '@/data/system/myWorldDesignRules';
import type { MyWorldStyleKey } from '@/data/system/myWorldSettingsCatalog';

const seedByKey = new Map(
  MYWORLD_DESIGN_RULES.map((rule) => [rule.component_key, rule] as const),
);

/**
 * Legge una regola della sezione Design System «MyWorld Style».
 * SoT runtime: `design_system_rules` (come Foundation). Fallback ai seed ufficiali
 * se la regola non è ancora presente in DB (pre-migration / cache vuota).
 */
export function useMyWorldStyles(
  componentKey: MyWorldStyleKey | string,
  isMobile = false,
): string {
  const fromDb = useDynamicStyles(componentKey, isMobile);

  return useMemo(() => {
    if (fromDb) return fromDb;
    const effectiveKey = isMobile ? `${componentKey}_mobile` : componentKey;
    const seed = seedByKey.get(effectiveKey) ?? seedByKey.get(componentKey);
    return seed ? constructClassName(seed) : '';
  }, [fromDb, componentKey, isMobile]);
}
