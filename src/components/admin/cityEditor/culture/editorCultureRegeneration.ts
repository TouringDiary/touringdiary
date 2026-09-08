import { generateCitySection, suggestCityPeople } from '../../../../services/ai';
import { validateAiSpecificSlugs } from '../../../../services/ai/generators/peopleCategoryValidation';
import {
  ensureFamousPersonCompletenessWithAi,
  toCompleteFamousPersonRequiredFields,
} from '../../../../services/ai/generators/peopleCompletenessPipeline';
import type { PersonDiscoveryResult } from '../../../../services/ai/generators/peopleGenerator';
import type { SaveCityPersonInput } from '../../../../services/city/entitiesService';
import { loadFamousPersonTaxonomy } from '../../../../services/city/famousPersonCategoryService';
import { deleteCityPerson, getCityPeople, saveCityPerson } from '../../../../services/cityService';
import { findExistingPortrait } from '../../../../services/mediaService';

export type PreparedPerson = SaveCityPersonInput;

/** Cleanup parziale dei personaggi precedenti dopo insert+details riusciti (duplicati possibili). */
export class PeopleReplacePartialCleanupError extends Error {
  readonly code = 'PEOPLE_REPLACE_PARTIAL_CLEANUP' as const;
  readonly failedIds: string[];

  constructor(failedIds: string[]) {
    super(
      `Nuovi personaggi e Storia/Patrono persistiti, ma ${failedIds.length} personaggi precedenti non sono stati rimossi (id: ${failedIds.join(', ')}). Possibili duplicati.`,
    );
    this.name = 'PeopleReplacePartialCleanupError';
    this.failedIds = failedIds;
  }
}

export function isPeopleReplacePartialCleanupError(
  error: unknown,
): error is PeopleReplacePartialCleanupError {
  return error instanceof PeopleReplacePartialCleanupError;
}

export async function prepareCompletePeople(
  suggestions: PersonDiscoveryResult[],
  cityName: string,
): Promise<{ prepared: PreparedPerson[]; incompleteCount: number }> {
  const prepared: PreparedPerson[] = [];
  let incompleteCount = 0;
  let orderIdx = 1;

  const taxonomy = await loadFamousPersonTaxonomy({ activeOnly: true });
  const activeSpecifics = taxonomy.specifics.map((s) => ({ slug: s.slug, id: s.id }));

  for (const p of suggestions) {
    if (!p.name?.trim()) continue;

    const slugValidation = validateAiSpecificSlugs(p.specificCategorySlugs ?? [], activeSpecifics);
    if (!slugValidation.ok) {
      incompleteCount += 1;
      continue;
    }

    const existingUrl = await findExistingPortrait(p.name);
    const recovered = await ensureFamousPersonCompletenessWithAi(
      {
        ...p,
        specificCategoryIds: slugValidation.ids,
        imageUrl: existingUrl ?? p.imageUrl,
      },
      cityName,
    );
    const required = toCompleteFamousPersonRequiredFields(recovered.person);
    if (!required) {
      incompleteCount += 1;
      continue;
    }
    prepared.push({
      ...required,
      status: 'draft',
      orderIndex: orderIdx++,
      quote: recovered.person.quote ?? p.quote,
      famousWorks: recovered.person.famousWorks ?? p.famousWorks,
      relatedPlaces: recovered.person.relatedPlaces ?? p.relatedPlaces,
      fullBio: recovered.person.fullBio ?? p.fullBio,
      privateLife: recovered.person.privateLife ?? p.privateLife,
      awards: recovered.person.awards ?? p.awards,
      collaborations: recovered.person.collaborations ?? p.collaborations,
      careerStats: recovered.person.careerStats ?? p.careerStats,
    });
  }

  return { prepared, incompleteCount };
}

/**
 * Insert-first senza TX DB:
 * inserisce i nuovi tenendo i vecchi; rollback applicativo se insert fallisce.
 */
export async function insertNewCityPeopleKeepingExisting(
  cityId: string,
  prepared: PreparedPerson[],
): Promise<{ createdIds: string[]; existingIds: string[] }> {
  const existingPeople = await getCityPeople(cityId, 'admin');
  const existingIds = existingPeople
    .map((p) => p.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  const createdIds: string[] = [];
  try {
    for (const person of prepared) {
      const saved = await saveCityPerson(cityId, { ...person, id: undefined });
      if (typeof saved.id !== 'string' || saved.id.length === 0) {
        throw new Error(
          'saveCityPerson non ha restituito un id persistito; impossibile garantire il rollback.',
        );
      }
      createdIds.push(saved.id);
    }
  } catch (error) {
    await Promise.allSettled(createdIds.map((id) => deleteCityPerson(id)));
    throw error;
  }

  return { createdIds, existingIds };
}

export async function removeCityPeopleByIds(ids: string[]): Promise<void> {
  const deleteFailures: string[] = [];
  for (const id of ids) {
    try {
      await deleteCityPerson(id);
    } catch {
      deleteFailures.push(id);
    }
  }
  if (deleteFailures.length > 0) {
    throw new PeopleReplacePartialCleanupError(deleteFailures);
  }
}

export async function fetchCultureRegenerationData(cityName: string, peopleCount = 5) {
  const [historyData, patronData, peopleSuggestions] = await Promise.all([
    generateCitySection(cityName, 'history'),
    generateCitySection(cityName, 'patron'),
    suggestCityPeople(cityName, [], '', peopleCount),
  ]);
  return { historyData, patronData, peopleSuggestions };
}
