/**
 * State machine selezione / filtri / memoria Angolo Cultura (§F4.2).
 */

import { type CultureFilterState, emptyCultureFilters } from '@/domain/city/famousPersonFilter';
import { getSessionItem, setSessionItem } from '@/services/storageService';

export type CultureSessionSnapshot = {
  selectedPersonId: string | null;
  filters: CultureFilterState;
  scrollTimeline: number;
  scrollRail: number;
  hasAppliedFilter: boolean;
};

export type ChronologicalPerson = {
  id: string;
  name: string;
  birthYear?: number | null;
  birthDate?: string | null;
};

function cultureSessionKey(cityId: string): string {
  return `td_culture_corner_${cityId}`;
}

function birthYearValue(person: ChronologicalPerson): number {
  return typeof person.birthYear === 'number' && Number.isFinite(person.birthYear)
    ? person.birthYear
    : Number.POSITIVE_INFINITY;
}

function birthDateValue(person: ChronologicalPerson): string {
  return typeof person.birthDate === 'string' ? person.birthDate : '';
}

/** Nascita ASC (più recente a destra), poi birthDate, name, id. */
export function comparePeopleChronological(a: ChronologicalPerson, b: ChronologicalPerson): number {
  const yearDiff = birthYearValue(a) - birthYearValue(b);
  if (yearDiff !== 0) return yearDiff;
  const dateDiff = birthDateValue(a).localeCompare(birthDateValue(b));
  if (dateDiff !== 0) return dateDiff;
  const nameDiff = a.name.localeCompare(b.name);
  if (nameDiff !== 0) return nameDiff;
  return a.id.localeCompare(b.id);
}

/** Ultimo nell’ordinamento cronologico (RIGHTMOST / più recente a destra). */
export function getRightmostPersonId(people: ChronologicalPerson[]): string | null {
  if (people.length === 0) return null;
  const sorted = [...people].sort(comparePeopleChronological);
  return sorted[sorted.length - 1]?.id ?? null;
}

/**
 * Apertura modale (A / G): memoria valida → restore; altrimenti RIGHTMOST.
 */
export function resolveSelectionOnOpen(args: {
  people: ChronologicalPerson[];
  memory: CultureSessionSnapshot | null;
}): string | null {
  const { people, memory } = args;
  if (people.length === 0) return null;
  const remembered = memory?.selectedPersonId ?? null;
  if (remembered && people.some((p) => p.id === remembered)) {
    return remembered;
  }
  return getRightmostPersonId(people);
}

/** Primo filtro (B): sempre RIGHTMOST del set filtrato (o null). */
export function resolveSelectionOnFirstFilter(args: {
  filteredPeople: ChronologicalPerson[];
}): string | null {
  return getRightmostPersonId(args.filteredPeople);
}

/**
 * Filtri successivi (D): mantieni selected se ancora nel set;
 * altrimenti RIGHTMOST; set vuoto → null.
 */
export function resolveSelectionOnSubsequentFilter(args: {
  filteredPeople: ChronologicalPerson[];
  currentSelectedId: string | null;
}): string | null {
  const { filteredPeople, currentSelectedId } = args;
  if (filteredPeople.length === 0) return null;
  if (currentSelectedId && filteredPeople.some((p) => p.id === currentSelectedId)) {
    return currentSelectedId;
  }
  return getRightmostPersonId(filteredPeople);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') return null;
    out.push(item);
  }
  return out;
}

function parseNullableFiniteNumber(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return undefined;
}

function parseCultureFilters(raw: unknown): CultureFilterState | null {
  if (!isPlainObject(raw)) return null;
  const masterSlugs = parseStringArray(raw.masterSlugs);
  const specificSlugs = parseStringArray(raw.specificSlugs);
  if (!masterSlugs || !specificSlugs) return null;
  const birthYearFrom = parseNullableFiniteNumber(raw.birthYearFrom);
  const birthYearTo = parseNullableFiniteNumber(raw.birthYearTo);
  if (birthYearFrom === undefined || birthYearTo === undefined) return null;
  return {
    masterSlugs,
    specificSlugs,
    birthYearFrom,
    birthYearTo,
  };
}

function parseCultureSessionSnapshot(raw: string): CultureSessionSnapshot | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isPlainObject(parsed)) return null;

  const selectedPersonId = parsed.selectedPersonId;
  if (
    selectedPersonId !== null &&
    (typeof selectedPersonId !== 'string' || selectedPersonId.trim() === '')
  ) {
    return null;
  }

  const filters = parseCultureFilters(parsed.filters);
  if (!filters) return null;

  if (
    typeof parsed.scrollTimeline !== 'number' ||
    !Number.isFinite(parsed.scrollTimeline) ||
    parsed.scrollTimeline < 0
  ) {
    return null;
  }
  if (
    typeof parsed.scrollRail !== 'number' ||
    !Number.isFinite(parsed.scrollRail) ||
    parsed.scrollRail < 0
  ) {
    return null;
  }
  if (typeof parsed.hasAppliedFilter !== 'boolean') return null;

  return {
    selectedPersonId: typeof selectedPersonId === 'string' ? selectedPersonId : null,
    filters,
    scrollTimeline: parsed.scrollTimeline,
    scrollRail: parsed.scrollRail,
    hasAppliedFilter: parsed.hasAppliedFilter,
  };
}

export function loadCultureSession(cityId: string): CultureSessionSnapshot | null {
  if (!cityId.trim()) return null;
  const raw = getSessionItem(cultureSessionKey(cityId));
  if (!raw) return null;
  return parseCultureSessionSnapshot(raw);
}

export function saveCultureSession(cityId: string, snapshot: CultureSessionSnapshot): void {
  if (!cityId.trim()) return;
  const payload: CultureSessionSnapshot = {
    selectedPersonId: snapshot.selectedPersonId,
    filters: snapshot.filters ?? emptyCultureFilters(),
    scrollTimeline: snapshot.scrollTimeline,
    scrollRail: snapshot.scrollRail,
    hasAppliedFilter: snapshot.hasAppliedFilter,
  };
  try {
    setSessionItem(cultureSessionKey(cityId), JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}
