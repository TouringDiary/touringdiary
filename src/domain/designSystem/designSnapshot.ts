import type { StyleRule } from '@/types/designSystem';

/** Persistito in `global_settings.design_system_snapshot`. */
export type DesignSystemSnapshot = {
  version: string;
  generatedAt: string;
  rules: StyleRule[];
};

/** Campi che influenzano rendering / preview (confronto override). */
const FINGERPRINT_FIELDS: (keyof StyleRule)[] = [
  'component_key',
  'element_name',
  'section',
  'css_class',
  'font_family',
  'text_size',
  'font_weight',
  'line_height',
  'text_transform',
  'tracking',
  'color_class',
  'effect_class',
  'preview_text',
];

export function styleRuleFingerprint(rule: StyleRule): string {
  const parts: string[] = [];
  for (const field of FINGERPRINT_FIELDS) {
    const value = rule[field];
    parts.push(`${field}=${value == null ? '' : String(value)}`);
  }
  return parts.join('|');
}

export function designRulesFingerprint(rules: StyleRule[]): string {
  return [...rules]
    .filter((r) => Boolean(r.component_key))
    .sort((a, b) => a.component_key.localeCompare(b.component_key))
    .map(styleRuleFingerprint)
    .join('\n');
}

export function designRulesMapsEqual(
  a: Record<string, StyleRule>,
  b: Record<string, StyleRule>,
): boolean {
  return designRulesFingerprint(Object.values(a)) === designRulesFingerprint(Object.values(b));
}

export function rulesArrayToMap(rules: StyleRule[]): Record<string, StyleRule> {
  return rules.reduce<Record<string, StyleRule>>((acc, rule) => {
    if (rule.component_key) {
      acc[rule.component_key] = rule;
    }
    return acc;
  }, {});
}

export function buildDesignSystemSnapshot(rules: StyleRule[]): DesignSystemSnapshot {
  const normalized = [...rules]
    .filter((r) => Boolean(r.component_key))
    .sort((a, b) => a.component_key.localeCompare(b.component_key));

  const generatedAt = new Date().toISOString();
  return {
    version: designRulesFingerprint(normalized),
    generatedAt,
    rules: normalized,
  };
}

export function isDesignSystemSnapshot(value: unknown): value is DesignSystemSnapshot {
  if (!value || typeof value !== 'object') return false;
  const v = value as DesignSystemSnapshot;
  return (
    typeof v.version === 'string' &&
    typeof v.generatedAt === 'string' &&
    Array.isArray(v.rules)
  );
}

export function rulesMapFromSnapshot(value: unknown): Record<string, StyleRule> | null {
  if (!isDesignSystemSnapshot(value)) return null;
  if (value.rules.length === 0) return {};
  return rulesArrayToMap(value.rules);
}
