import type { CityDetails, FamousPerson } from '../../types/index';
import { getPrimarySpecific } from '@/domain/city/famousPersonCategories';
import { resolveViewportBirthYear } from './useCultureCornerTimeline';

export interface DerivedPersonData {
  person: FamousPerson;
  id: string;
  name: string;
  imageUrl?: string;
  viewportBirthYear: number | null;
  yearLabel: string;
  primaryMasterLabel: string | null;
  sortableCategories: Array<{
    label: string;
    slug: string;
    orderIndex: number;
    masterOrderIndex: number;
    masterSlug: string;
  }>;
  primarySpecific: {
    label: string;
    slug: string;
    orderIndex: number;
    masterOrderIndex: number;
    masterSlug: string;
  } | null;
  cityBadge: string | null;
  lifespan: string | null;
}

export function toSortableCategories(person: FamousPerson) {
  return (person.categories ?? [])
    .filter((c) => c.isActive !== false)
    .map((c) => ({
      label: c.specificLabel,
      slug: c.specificSlug,
      orderIndex: c.specificOrderIndex,
      masterOrderIndex: c.masterOrderIndex,
      masterSlug: c.masterSlug,
    }));
}

export function getPrimaryMasterLabel(person: FamousPerson): string | null {
  const cats = (person.categories ?? []).filter((c) => c.isActive !== false);
  if (cats.length === 0) return null;
  const primary = getPrimarySpecific(toSortableCategories(person));
  if (!primary) return null;
  const ref = cats.find((c) => c.specificSlug === primary.slug);
  const label = ref?.masterLabel?.trim();
  return label ? label : null;
}

export function resolveCityBadgeName(city: CityDetails, personCityId: string): string | null {
  if (!city.isVirtual && city.name !== 'Around Me') return null;
  const fromAgg = city.aggregatedCities?.find((c) => c.id === personCityId)?.name;
  if (fromAgg?.trim()) return fromAgg.trim();
  return null;
}

export function derivePersonData(person: FamousPerson, city: CityDetails): DerivedPersonData {
  const sortableCats = toSortableCategories(person);
  const primarySpec = getPrimarySpecific(sortableCats);
  const primaryMaster = getPrimaryMasterLabel(person);
  const viewportBirthYear = resolveViewportBirthYear(person);
  const yearLabel = viewportBirthYear != null ? String(viewportBirthYear) : '—';
  const cityBadge = person.cityId ? resolveCityBadgeName(city, person.cityId) : null;
  const lifespan = person.lifespanDisplay?.trim() || null;

  return {
    person,
    id: person.id,
    name: person.name,
    imageUrl: person.imageUrl,
    viewportBirthYear,
    yearLabel,
    primaryMasterLabel: primaryMaster,
    sortableCategories: sortableCats,
    primarySpecific: primarySpec,
    cityBadge,
    lifespan,
  };
}

export function derivePeopleData(people: FamousPerson[], city: CityDetails): DerivedPersonData[] {
  return people.map((p) => derivePersonData(p, city));
}
