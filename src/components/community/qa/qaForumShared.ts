import type { CitySummary } from '../../../types/index';

export const QA_GENERAL_CITY_LABEL = 'Generale / Campania';

/** Indentazione CSS del thread: tetto VISIVO su smartphone. La profondità dei dati non viene troncata. */
export const MAX_NEST_INDENT_DEPTH = 3;

export function splitDisplayName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: '—', lastName: '—' };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '—' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/** Risolve il nome città da sorgente reale; nessun fallback inventato. */
export function resolveQaCityName(cityId: string, manifest: CitySummary[]): string | null {
  if (cityId === 'general') return QA_GENERAL_CITY_LABEL;
  const found = manifest.find((c) => c.id === cityId);
  return found ? found.name : null;
}

/** Copia ordinata per nome (non muta l'array sorgente). */
export function sortCitiesByName(cities: CitySummary[]): CitySummary[] {
  return [...cities].sort((a, b) => a.name.localeCompare(b.name));
}
