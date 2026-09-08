/**
 * Filtri Angolo Cultura: Master OR + Specific OR + birthYear inclusivo.
 * SoT: AI_CONTEXT/AUDIT_ANGOLO_CULTURA_TIMELINE.md §53 / §F4.
 */

export type CultureFilterState = {
  masterSlugs: string[];
  specificSlugs: string[];
  birthYearFrom: number | null;
  birthYearTo: number | null;
};

export type FamousPersonLike = {
  id: string;
  birthYear?: number | null;
  categories?: Array<{
    specificSlug: string;
    masterSlug: string;
  }>;
};

export function emptyCultureFilters(): CultureFilterState {
  return {
    masterSlugs: [],
    specificSlugs: [],
    birthYearFrom: null,
    birthYearTo: null,
  };
}

export function hasActiveCultureFilters(filters: CultureFilterState): boolean {
  return (
    filters.masterSlugs.length > 0 ||
    filters.specificSlugs.length > 0 ||
    filters.birthYearFrom != null ||
    filters.birthYearTo != null
  );
}

function matchesMasterFilter(person: FamousPersonLike, masterSlugs: string[]): boolean {
  if (masterSlugs.length === 0) return true;
  const cats = person.categories ?? [];
  const selected = new Set(masterSlugs);
  return cats.some((c) => selected.has(c.masterSlug));
}

function matchesSpecificFilter(person: FamousPersonLike, specificSlugs: string[]): boolean {
  if (specificSlugs.length === 0) return true;
  const cats = person.categories ?? [];
  const selected = new Set(specificSlugs);
  return cats.some((c) => selected.has(c.specificSlug));
}

function matchesBirthYearRange(
  person: FamousPersonLike,
  from: number | null,
  to: number | null,
): boolean {
  if (from == null && to == null) return true;
  const year = person.birthYear;
  if (typeof year !== 'number' || !Number.isFinite(year)) return false;
  if (from != null && year < from) return false;
  if (to != null && year > to) return false;
  return true;
}

/**
 * (masters empty OR has linked specific with master in selected)
 * AND (specifics empty OR has selected specific)
 * AND (no range OR birth_year in inclusive range)
 */
export function filterFamousPeople<T extends FamousPersonLike>(
  people: T[],
  filters: CultureFilterState,
): T[] {
  return people.filter(
    (person) =>
      matchesMasterFilter(person, filters.masterSlugs) &&
      matchesSpecificFilter(person, filters.specificSlugs) &&
      matchesBirthYearRange(person, filters.birthYearFrom, filters.birthYearTo),
  );
}
