/**
 * Stable JSON serialization for dirty detection.
 * Sorts object keys recursively for deterministic comparison.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortKeys(obj[key]);
  }
  return sorted;
}

export function snapshotsEqual(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}
