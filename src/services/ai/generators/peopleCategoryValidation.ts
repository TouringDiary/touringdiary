/**
 * Valida gli slug Specific restituiti dall'AI contro lo standard attivo.
 * Non inventa mapping: ogni slug deve esistere tra le Specific assegnabili.
 */
export function validateAiSpecificSlugs(
  slugs: string[],
  activeSpecifics: { slug: string; id: string }[],
): { ok: true; ids: string[] } | { ok: false; invalid: string[] } {
  const bySlug = new Map(activeSpecifics.map((s) => [s.slug, s.id]));
  const ids: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const raw of slugs) {
    if (typeof raw !== 'string') continue;
    const slug = raw.trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    const id = bySlug.get(slug);
    if (!id) {
      invalid.push(slug);
    } else {
      ids.push(id);
    }
  }

  if (invalid.length > 0 || ids.length === 0) {
    return { ok: false, invalid };
  }
  return { ok: true, ids };
}
